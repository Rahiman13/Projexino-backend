const Newsletter = require('../models/newsletter'); // Assuming this is the correct model
const Subscriber = require('../models/Subscriber');
const Blog = require('../models/blog');
const transporter = require('../utils/transporter');
const cloudinary = require('../config/cloudinaryConfig');

// Get all newsletters
const getNewsletters = async (req, res) => {
    try {
        const newsletters = await Newsletter.find();
        res.status(200).json(newsletters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Newsletters By Id
const getNewsletterById = async (req, res) => {
    try {
        const newsLetterId = req.params.id
        const newsLetter = await Newsletter.findById(newsLetterId)
        if (!newsLetter) {
            return res.status(404).json({ message: "NewsLetter not found" })
        }
        res.status(200).json(newsLetter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Create a new newsletter
const createNewsletter = async (req, res) => {
    try {
        const {
            title,
            subject,
            content,
            images,
            status,
            metadata
        } = req.body;

        const newsletter = new Newsletter({
            title,
            subject,
            content,
            images,
            status,
            metadata
        });

        await newsletter.save();
        res.status(201).json(newsletter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a newsletter by ID
const updateNewsletter = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNewsletter = await Newsletter.findByIdAndUpdate(
            id,
            {
                ...req.body,
                updatedAt: Date.now()
            },
            { new: true }
        );
        res.status(200).json(updatedNewsletter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a newsletter by ID
const deleteNewsletter = async (req, res) => {
    try {
        const { id } = req.params;
        await Newsletter.findByIdAndDelete(id);
        res.status(200).json({ message: 'Newsletter deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Get total count till now
const getTotalNewslettersCount = async (req, res) => {
    try {
        const totalCount = await Newsletter.countDocuments();
        res.status(200).json({ totalCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get monthly counts for a selected year
const getMonthlyNewsletterCounts = async (req, res) => {
    try {
        const { year } = req.params;

        const monthlyCounts = await Newsletter.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id": 1 }, // Sort by month (1 = Jan, 12 = Dec)
            },
        ]);

        // Format the result to include missing months with zero counts
        const result = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            count: 0,
        }));

        monthlyCounts.forEach(({ _id, count }) => {
            result[_id - 1].count = count; // Assign count to the corresponding month
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send newsletter
const sendNewsletter = async (req, res) => {
    try {
        const { id } = req.params;
        const newsletter = await Newsletter.findById(id);

        if (!newsletter) {
            return res.status(404).json({ error: 'Newsletter not found' });
        }

        // Get all active subscribers
        const subscribers = await Subscriber.find({ status: 'Subscribed' });
        let successful = 0;
        let failed = 0;

        // Enhanced email template with modern design
        const content = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }
            
            body {
                background: #f5f5f5;
                color: #19234d;
                line-height: 1.7;
            }
            
            .wrapper {
                max-width: 800px;
                margin: 40px auto;
                padding: 0 20px;
                position: relative;
            }
            
            /* Glassmorphism effect */
            .wrapper::before {
                content: '';
                position: absolute;
                top: -20px;
                left: 20%;
                right: 20%;
                height: calc(100% + 40px);
                background: linear-gradient(135deg, 
                    rgba(43, 90, 158, 0.1), 
                    rgba(217, 118, 74, 0.1));
                filter: blur(100px);
                z-index: -1;
                animation: ambientLight 10s ease-in-out infinite;
            }

            @keyframes ambientLight {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-20px) scale(1.05); }
            }
            
            .container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 24px;
                box-shadow: 
                    0 25px 50px -12px rgba(25, 35, 77, 0.15),
                    0 0 0 1px rgba(25, 35, 77, 0.05);
                overflow: hidden;
                position: relative;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .header {
                background: linear-gradient(135deg, #2b5a9e 0%, #19234d 100%);
                color: #fff;
                padding: 80px 60px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            /* Modern geometric pattern overlay */
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: 
                    repeating-linear-gradient(
                        45deg,
                        rgba(255, 255, 255, 0.1) 0px,
                        rgba(255, 255, 255, 0.1) 1px,
                        transparent 1px,
                        transparent 10px
                    );
                animation: patternMove 20s linear infinite;
            }

            @keyframes patternMove {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .header h1 {
                font-size: 2.5rem;
                font-weight: 800;
                margin-bottom: 24px;
                position: relative;
                background: linear-gradient(to right, #fff, #e2e8f0);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
            }

            .content {
                padding: 40px;
                position: relative;
            }

            .content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(43, 90, 158, 0.2),
                    transparent
                );
            }

            .newsletter-content {
                font-size: 1.1rem;
                line-height: 1.8;
                color: #334155;
            }

            /* Image styling */
            .image-container {
                margin: 30px 0;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 20px -10px rgba(25, 35, 77, 0.1);
            }

            .newsletter-image {
                width: 100%;
                height: auto;
                display: block;
            }

            /* Button styling */
            .button-container {
                text-align: center;
                margin: 30px 0;
            }

            .button {
                display: inline-block;
                padding: 12px 32px;
                background: linear-gradient(135deg, #2b5a9e 0%, #19234d 100%);
                color: #fff;
                text-decoration: none;
                border-radius: 100px;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(43, 90, 158, 0.2);
            }

            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(43, 90, 158, 0.3);
            }

            .footer {
                background: rgba(245, 245, 245, 0.8);
                color: #19234d;
                padding: 40px;
                text-align: center;
                position: relative;
                border-top: 1px solid rgba(25, 35, 77, 0.1);
            }

            .social-links {
                margin-bottom: 30px;
            }

            .social-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                margin: 0 10px;
                background: linear-gradient(135deg, #2b5a9e 0%, #19234d 100%);
                border-radius: 50%;
                transition: transform 0.3s ease;
            }

            .social-icon:hover {
                transform: translateY(-3px);
            }

            .unsubscribe {
                display: inline-block;
                padding: 10px 24px;
                color: #d9764a;
                text-decoration: none;
                font-weight: 500;
                border: 1px solid #d9764a;
                border-radius: 100px;
                transition: all 0.3s ease;
                margin-top: 20px;
            }

            .unsubscribe:hover {
                background: #d9764a;
                color: #fff;
            }

            @media (max-width: 768px) {
                .wrapper {
                    margin: 20px auto;
                    padding: 0 15px;
                }

                .header {
                    padding: 60px 30px;
                }

                .header h1 {
                    font-size: 2rem;
                }

                .content {
                    padding: 30px 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>${newsletter.title}</h1>
                </div>
                
                <div class="content">
                    <div class="newsletter-content">
                        ${newsletter.content}
                        
                        ${newsletter.images && newsletter.images.length > 0 ? `
                            <div class="image-container">
                                <img src="${newsletter.images[0]}" alt="Newsletter Image" class="newsletter-image">
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="footer">
                    <div class="social-links">
                        <a href="#" class="social-icon">
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a href="#" class="social-icon">
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                        </a>
                        <a href="#" class="social-icon">
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.899 1.38.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                            </svg>
                        </a>
                    </div>
                    <p>Thank you for being part of our community!</p>
                    <p>You're receiving this email because you subscribed to our newsletter.</p>
                    <a href="https://projexino.com/unsubscribe/{{subscriberEmail}}" class="unsubscribe">
                        Unsubscribe from our newsletter
                    </a>
                </div>
            </div>
        </div>
    </body>
</html>`;

        // Send to all subscribers
        for (const subscriber of subscribers) {
            try {
                const personalizedContent = content.replace('{{subscriberEmail}}', encodeURIComponent(subscriber.email));

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: subscriber.email,
                    subject: newsletter.subject,
                    html: personalizedContent
                });
                successful++;
            } catch (error) {
                console.error(`Failed to send to ${subscriber.email}:`, error);
                failed++;
            }
        }

        // Update newsletter status
        newsletter.status = 'Sent';
        newsletter.sentAt = Date.now();
        newsletter.recipients = {
            total: subscribers.length,
            successful,
            failed
        };

        await newsletter.save();

        res.status(200).json({
            message: 'Newsletter sent successfully',
            stats: {
                total: subscribers.length,
                successful,
                failed
            }
        });
    } catch (error) {
        console.error('Error sending newsletter:', error);
        res.status(500).json({ error: error.message });
    }
};

// Schedule a blog newsletter
const scheduleBlogNewsletter = async (req, res) => {
    try {
        const { blogIds, scheduledFor, subject, additionalContent } = req.body;

        // Validate required fields
        if (!blogIds || !Array.isArray(blogIds) || !scheduledFor) {
            return res.status(400).json({ error: 'Invalid input. Required: blogIds array and scheduledFor date' });
        }

        // Convert input UTC time to IST
        const scheduledTimeIST = new Date(scheduledFor);

        // Format IST time for display
        const istFormatter = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const formattedISTTime = istFormatter.format(scheduledTimeIST.getTime() - (5.5 * 60 * 60 * 1000));

        // Convert IST to UTC for storage
        const scheduledTimeUTC = new Date(scheduledTimeIST.getTime() - (5.5 * 60 * 60 * 1000));

        // Fetch the selected blogs
        const selectedBlogs = await Blog.find({ _id: { $in: blogIds } });
        if (!selectedBlogs.length) {
            return res.status(404).json({ error: 'No blogs found with the provided IDs' });
        }

        // Generate HTML content with improved design
        const content = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }
            
            body {
                background: #f5f5f5;
                color: #19234d;
                line-height: 1.7;
            }
            
            .wrapper {
                max-width: 800px;
                margin: 40px auto;
                padding: 0 20px;
            }
            
            .container {
                background: #fff;
                border-radius: 24px;
                box-shadow: 
                    0 25px 50px -12px rgba(25, 35, 77, 0.1),
                    0 0 0 1px rgba(25, 35, 77, 0.05);
                overflow: hidden;
                position: relative;
            }

            /* Decorative top bar */
            .container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 6px;
                background: linear-gradient(90deg, #2b5a9e, #d9764a);
            }
            
            .header {
                background: linear-gradient(135deg, #2b5a9e 0%, #19234d 100%);
                color: #fff;
                padding: 100px 60px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            /* Enhanced abstract pattern overlay */
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    radial-gradient(circle at 20% 30%, rgba(217, 118, 74, 0.15) 0%, transparent 70%),
                    radial-gradient(circle at 80% 70%, rgba(43, 90, 158, 0.2) 0%, transparent 70%),
                    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
                opacity: 1;
            }
            
            .header h1 {
                font-size: 2rem;
                font-weight: 800;
                margin-bottom: 24px;
                position: relative;
                text-transform: uppercase;
                letter-spacing: -0.02em;
                text-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                animation: shimmer 2s infinite linear;
            }

            @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
            }

            .content {
                padding: 60px;
                font-size: 1.125rem;
                color: #334155;
                line-height: 1.8;
            }

            .footer {
                background: #f5f5f5;
                color: #19234d;
                padding: 60px;
                text-align: center;
                border-top: 1px solid rgba(25, 35, 77, 0.1);
            }

            .footer p {
                margin-bottom: 20px;
                line-height: 1.6;
            }

            .unsubscribe {
                display: inline-block;
                padding: 8px 16px;
                background-color: transparent;
                color: #d9764a;
                text-decoration: none;
                font-weight: 500;
                border: 1px solid #d9764a;
                border-radius: 6px;
                transition: all 0.3s ease;
            }

            .unsubscribe:hover {
                background-color: #d9764a;
                color: #fff;
            }

            @media (max-width: 768px) {
                .wrapper {
                    margin: 20px auto;
                }

                .header {
                    padding: 60px 30px;
                }

                .header h1 {
                    font-size: 2.5rem;
                }

                .content {
                    padding: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1 >Featured Blog Posts</h1>
                    ${additionalContent ? `<p>${additionalContent}</p>` : ''}
                </div>
                
                <div class="blog-grid">
                    ${selectedBlogs.map(blog => `
                        <article class="blog-card">
                            ${blog.featuredImage ? `
                                <div class="blog-image">
                                    <img src="${blog.featuredImage}" alt="${blog.title}"/>
                                </div>
                            ` : ''}
                            <div class="blog-content">
                                <h2 class="blog-title">${blog.title}</h2>
                                <div class="blog-meta">
                                    <span class="meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        ${new Date(blog.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
                                    </span>
                                    ${blog.authorName ? `
                                        <span class="meta-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            ${blog.authorName}
                                        </span>
                                    ` : ''}
                                </div>
                                <p class="blog-description">
                                    ${blog.excerpt || formatBlogContent(blog.content)}
                                </p>
                                <a href="https://projexino.com/blogs/${blog._id}" class="read-more">
                                    Read More
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </a>
                            </div>
                        </article>
                    `).join('')}
                </div>

                <div class="footer">
                    <p>Thank you for being part of our community!</p>
                    <p>You're receiving this email because you subscribed to our newsletter.</p>
                    <a href="https://projexino.com/unsubscribe/{{subscriberEmail}}" class="unsubscribe">
                        Unsubscribe from our newsletter
                    </a>
                </div>
            </div>
        </div>
    </body>
</html>
`;

        // Create newsletter with UTC time
        const newsletter = new Newsletter({
            title: `Blog Newsletter - ${formattedISTTime}`,
            subject: subject || 'Latest Blog Posts You Might Like',
            content,
            status: 'Scheduled',
            metadata: {
                scheduledFor: scheduledTimeIST,
                tags: ['blog-newsletter'],
                category: 'Blog Digest',
                description: `Scheduled newsletter featuring ${selectedBlogs.length} blog posts (IST: ${formattedISTTime})`
            }
        });

        await newsletter.save();

        // Calculate delay in milliseconds
        const scheduledTime = scheduledTimeUTC.getTime() - Date.now();

        if (scheduledTime > 0) {
            setTimeout(async () => {
                try {
                    console.log('Starting scheduled newsletter send...');
                    const subscribers = await Subscriber.find({ status: 'Subscribed' });
                    console.log(`Found ${subscribers.length} subscribers`);
                    let successful = 0;
                    let failed = 0;

                    for (const subscriber of subscribers) {
                        try {
                            console.log(`Attempting to send to ${subscriber.email}`);
                            const personalizedContent = content.replace('{{subscriberEmail}}', encodeURIComponent(subscriber.email));
                            await transporter.sendMail({
                                from: process.env.EMAIL_USER || 'rahiman@projexino.com',
                                to: subscriber.email,
                                subject: newsletter.subject,
                                html: personalizedContent,
                            });
                            successful++;
                            console.log(`Successfully sent to ${subscriber.email}`);
                        } catch (error) {
                            failed++;
                            console.error(`Failed to send to ${subscriber.email}:`, error);
                        }
                    }

                    console.log(`Newsletter send complete. Success: ${successful}, Failed: ${failed}`);

                    // Update newsletter status and counts
                    newsletter.status = 'Sent';
                    newsletter.sentAt = new Date();
                    newsletter.recipients = {
                        total: subscribers.length,
                        successful,
                        failed
                    };
                    await newsletter.save();
                    console.log('Newsletter status updated');

                } catch (error) {
                    console.error('Error in scheduled send:', error);
                    newsletter.status = 'Failed';
                    await newsletter.save();
                }
            }, scheduledTime);

            console.log(`Newsletter scheduled for ${new Date(Date.now() + scheduledTime).toISOString()}`);
        }

        res.status(201).json({
            message: 'Newsletter scheduled successfully',
            newsletter: {
                ...newsletter.toObject(),
                scheduledTimeIST: formattedISTTime
            }
        });

    } catch (error) {
        console.error('Error scheduling newsletter:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get scheduled newsletters (with IST conversion)
const getScheduledNewsletters = async (req, res) => {
    try {
        // Get current time in UTC
        const currentTime = new Date();
        console.log('Current Time (UTC):', currentTime);

        // Add 5 hours and 30 minutes to current time to adjust to IST
        const istAdjustedTime = new Date(currentTime.getTime() + 5.5 * 60 * 60 * 1000);
        console.log('Current Time (IST):', istAdjustedTime);

        // Find newsletters with status 'Scheduled' and 'scheduledFor' greater than the IST-adjusted current date
        const newsletters = await Newsletter.find({
            status: 'Scheduled',
            'metadata.scheduledFor': { $gt: istAdjustedTime } // Compare against IST-adjusted time
        }).sort({ 'metadata.scheduledFor': 1 });

        if (!newsletters || newsletters.length === 0) {
            return res.status(404).json({ message: 'No scheduled newsletters found' });
        }

        // Debug: Log the newsletters fetched to check their structure
        // console.log('Scheduled Newsletters:', newsletters);

        // Convert scheduledFor times to IST for response
        const newslettersWithIST = newsletters.map(newsletter => {
            const scheduledFor = new Date(newsletter.metadata.scheduledFor);

            // Use Intl.DateTimeFormat to convert to IST (Asia/Kolkata timezone)
            const istOptions = {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };

            const scheduledForIST = new Intl.DateTimeFormat('en-IN', istOptions).format(scheduledFor);

            return {
                ...newsletter.toObject(),
                scheduledTimeIST: scheduledFor // formatted time in IST
            };
        });

        // Send the final result
        res.status(200).json(newslettersWithIST);
    } catch (error) {
        console.error('Error fetching scheduled newsletters:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get Scheduled Newsletter counts
const getScheduledNewslettersCount = async (req, res) => {
    try {
        // Count the number of newsletters with status 'Scheduled'
        const scheduledCount = await Newsletter.countDocuments({ status: "Scheduled" });

        // Respond with the count
        res.status(200).json({
            scheduledCount: scheduledCount
        });
    } catch (error) {
        console.error("Error fetching scheduled newsletters count:", error);
        res.status(500).json({ error: "An error occurred while fetching the count of scheduled newsletters" });
    }
};




// Cancel scheduled newsletter
const cancelScheduledNewsletter = async (req, res) => {
    try {
        const { id } = req.params;
        const newsletter = await Newsletter.findById(id);

        if (!newsletter) {
            return res.status(404).json({ error: 'Newsletter not found' });
        }

        if (newsletter.status !== 'Scheduled') {
            return res.status(400).json({ error: 'Only scheduled newsletters can be cancelled' });
        }

        newsletter.status = 'Draft';
        await newsletter.save();

        res.status(200).json({ message: 'Newsletter cancelled successfully', newsletter });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Count of cancelled newsletters
const getCancelledNewslettersCount = async (req, res) => {
    try {
        // Count the number of newsletters with status 'Draft' (Cancelled)
        const cancelledCount = await Newsletter.countDocuments({ status: "Draft" });

        // Respond with the count
        res.status(200).json({
            cancelledCount: cancelledCount
        });
    } catch (error) {
        console.error("Error fetching cancelled newsletters count:", error);
        res.status(500).json({ error: "An error occurred while fetching the count of cancelled newsletters" });
    }
};

// Get cancelled newsletters
const getCancelledNewsletters = async (req, res) => {
    try {
        // Fetch newsletters with status 'cancelled'
        const cancelledNewsletters = await Newsletter.find({ status: 'Draft' });

        // Return the result
        res.status(200).json({
            success: true,
            data: cancelledNewsletters,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({
            success: false,
            message: 'Error fetching cancelled newsletters',
            error: error.message,
        });
    }
};


// Send announcement as newsletter
const sendAnnouncement = async (req, res) => {
    try {
        const { title, subject, announcement, buttonText, buttonUrl } = req.body;

        // Validate required fields
        if (!title || !subject || !announcement) {
            return res.status(400).json({
                error: 'Missing required fields. Title, subject, and announcement are required.'
            });
        }

        // Handle image uploads to Cloudinary
        let uploadedImages = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: 'newsletter-announcements' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result.secure_url);
                        }
                    ).end(file.buffer);
                });
            });

            uploadedImages = await Promise.all(uploadPromises);
        }

        const content = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }
            body {
                background: #f5f7fa;
                color: #1a1f36;
                line-height: 1.5;
            }
            .wrapper {
                max-width: 800px;
                margin: 20px auto;
                padding: 0 15px;
            }
            .container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 16px;
                box-shadow: 0 15px 30px -12px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                position: relative;
            }
            .header {
                background: linear-gradient(135deg, #2b5a9e 0%, #d9764a 100%);
                color: #fff;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 2.25rem;
                font-weight: 700;
                margin-bottom: 16px;
                letter-spacing: -0.02em;
            }
            .content {
                padding: 30px;
                font-size: 1rem;
                color: #334155;
                line-height: 1.6;
            }
            .image-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
                margin: 20px 0;
            }
            .grid-image-container {
                position: relative;
                padding-top: 75%;
                border-radius: 12px;
                overflow: hidden;
            }
            .grid-image {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .button-container {
                text-align: center;
                margin: 25px 0;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #2b5a9e 0%, #d9764a 100%);
                color: #fff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 1rem;
            }
            .footer {
                background: #19234d;
                color: #e2e8f0;
                padding: 30px;
                text-align: center;
            }
            .social-links {
                display: flex;
                justify-content: center;
                gap: 16px;
                margin: 20px 0;
            }
            .social-icon {
                width: 36px;
                height: 36px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .unsubscribe {
                display: inline-block;
                padding: 8px 16px;
                color: #d9764a;
                text-decoration: none;
                font-weight: 500;
                border: 1px solid rgba(217, 118, 74, 0.3);
                border-radius: 6px;
                margin-top: 16px;
            }
            @media (max-width: 640px) {
                .wrapper { padding: 10px; }
                .header { padding: 30px 20px; }
                .content { padding: 20px; }
                .image-grid { grid-template-columns: 1fr; }
            }

            /* Enhanced image styles for single image */
.single-image-container {
    width: 100%;
    height: 500px;
    margin: 30px 0;
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    transform: perspective(1000px) rotateX(2deg);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.single-image-container:hover {
    transform: perspective(1000px) rotateX(0deg);
}

.single-image-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        135deg,
        rgba(43, 90, 158, 0.2),
        rgba(217, 118, 74, 0.2)
    );
    z-index: 1;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.single-image-container:hover::before {
    opacity: 1;
}

.single-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.01);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.single-image-container:hover .single-image {
    transform: scale(1.05);
}

/* Enhanced image grid styles */
.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin: 30px 0;
    padding: 0 15px;
}

.grid-image-container {
    aspect-ratio: 4/3;
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.05);
    transform: translateY(0) scale(1);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.grid-image-container:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 
        0 30px 60px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.1);
}

.grid-image-container::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to bottom,
        transparent,
        rgba(25, 35, 77, 0.3)
    );
    opacity: 0;
    transition: opacity 0.3s ease;
}

.grid-image-container:hover::after {
    opacity: 1;
}

.grid-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    filter: brightness(1);
}

.grid-image-container:hover .grid-image {
    transform: scale(1.1);
    filter: brightness(1.1);
}

@media (max-width: 768px) {
    .single-image-container {
        height: 300px;
        transform: none;
    }
    
    .image-grid {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 0 10px;
    }
}

.content-images {
    margin: 40px 0;
    padding: 0 20px;
}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                
                ${uploadedImages.length > 0 ?
                `<div class="content-images">
                        ${uploadedImages.length === 1 ?
                    `<div class="single-image-container">
                                <img src="${uploadedImages[0]}" alt="Announcement Image" class="single-image">
                            </div>` :
                    `<div class="image-grid">
                                ${uploadedImages.map(img => `
                                    <div class="grid-image-container">
                                        <img src="${img}" alt="Announcement Image" class="grid-image">
                                    </div>
                                `).join('')}
                            </div>`
                }
                    </div>`
                : ''}
                <div class="content">
                    ${announcement}
                </div>

                ${buttonText && buttonUrl ? `
                    <div class="button-container">
                        <a href="${buttonUrl}" class="button">${buttonText}</a>
                    </div>
                ` : ''}
                </div>
                <div class="footer">
                    <div class="social-links">
                        <!-- Social icons here -->
                    </div>
                    <p>Thank you for being part of our community!</p>
                    <a href="https://projexino.com/unsubscribe/{{subscriberEmail}}" class="unsubscribe">
                        Unsubscribe from our newsletter
                    </a>
                </div>
            </div>
        </div>
    </body>
</html>`;

        // Create newsletter with uploaded images
        const newsletter = new Newsletter({
            title,
            subject,
            content,
            images: uploadedImages,
            status: 'Draft',
            metadata: {
                type: 'announcement',
                tags: ['announcement'],
                category: 'Announcements'
            }
        });

        await newsletter.save();

        // Send to all subscribers
        const subscribers = await Subscriber.find({ status: 'Subscribed' });
        let successful = 0;
        let failed = 0;

        for (const subscriber of subscribers) {
            try {
                const personalizedContent = content.replace('{{subscriberEmail}}', encodeURIComponent(subscriber.email));

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: subscriber.email,
                    subject: subject,
                    html: personalizedContent
                });
                successful++;
            } catch (error) {
                console.error(`Failed to send to ${subscriber.email}:`, error);
                failed++;
            }
        }

        // Update newsletter status and counts
        newsletter.status = 'Sent';
        newsletter.sentAt = Date.now();
        newsletter.recipients = {
            total: subscribers.length,
            successful,
            failed
        };

        await newsletter.save();

        res.status(200).json({
            message: 'Announcement sent successfully',
            newsletter: {
                ...newsletter.toObject(),
                stats: {
                    total: subscribers.length,
                    successful,
                    failed
                }
            }
        });

    } catch (error) {
        console.error('Error sending announcement:', error);
        res.status(500).json({ error: error.message });
    }
};


// Controller to get monthly announcement count for a specific year
const getMonthlyAnnouncementCount = async (req, res) => {
    const { year } = req.params; // Year passed as a URL parameter
    try {
        // Validate the year parameter
        if (!year || isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
            return res.status(400).json({ error: 'Invalid year provided' });
        }

        // Aggregate the count of announcements for each month
        const result = await Newsletter.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01`), // Start of the year
                        $lte: new Date(`${year}-12-31`), // End of the year
                    },
                },
            },
            {
                $group: {
                    _id: { $month: '$createdAt' }, // Group by the month of createdAt
                    count: { $sum: 1 }, // Count the number of newsletters per month
                },
            },
            {
                $project: {
                    month: '$_id', // Rename _id to month
                    count: 1,
                    _id: 0,
                },
            },
            {
                $sort: { month: 1 }, // Sort by month in ascending order
            },
        ]);

        // Fill in missing months with 0 count if necessary
        const months = Array.from({ length: 12 }, (_, index) => {
            const monthData = result.find(r => r.month === index + 1);
            return { month: index + 1, count: monthData ? monthData.count : 0 };
        });

        return res.status(200).json({ year, monthlyCounts: months });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching monthly announcement count' });
    }
};

// Unsubscribe Subscriber
const unsubscribeSubscriber = async (req, res) => {
    try {
        const email = req.query.email || req.body.email; // Get email from query params or body

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const subscriber = await Subscriber.findOne({ email });

        if (!subscriber) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        if (subscriber.status === 'Unsubscribed') {
            return res.status(400).json({ message: 'Subscriber is already unsubscribed' });
        }

        subscriber.status = 'Unsubscribed';
        await subscriber.save();

        // Send a confirmation response
        res.status(200).json({
            message: 'Successfully unsubscribed from the newsletter',
            subscriber
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const formatBlogContent = (content, maxLength = 150) => {
    let formattedText = '';
    let totalLength = 0;

    for (const block of content) {
        if (totalLength >= maxLength) break;

        switch (block.type) {
            case 'paragraph':
                formattedText += block.text + '\n\n';
                totalLength += block.text.length;
                break;
            case 'heading':
                formattedText += block.text + '\n';
                totalLength += block.text.length;
                break;
            case 'list':
                block.items.forEach(item => {
                    formattedText += `• ${item}\n`;
                    totalLength += item.length + 2;
                });
                formattedText += '\n';
                break;
            case 'quote':
                formattedText += `"${block.text}"\n\n`;
                totalLength += block.text.length + 2;
                break;
        }
    }

    return totalLength > maxLength 
        ? formattedText.substring(0, maxLength) + '...'
        : formattedText;
};

module.exports = {
    getNewsletters,
    getNewsletterById,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    getTotalNewslettersCount,
    getMonthlyNewsletterCounts,
    sendNewsletter,
    scheduleBlogNewsletter,
    getScheduledNewsletters,
    getScheduledNewslettersCount,
    cancelScheduledNewsletter,
    getCancelledNewslettersCount,
    getCancelledNewsletters,
    sendAnnouncement,
    getMonthlyAnnouncementCount,
    unsubscribeSubscriber,
};
