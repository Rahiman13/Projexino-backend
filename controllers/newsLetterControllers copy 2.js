const Newsletter = require('../models/newsletter'); // Assuming this is the correct model
const Subscriber = require('../models/Subscriber');
const Blog = require('../models/blog');
const transporter = require('../utils/transporter');

// Get all newsletters
const getNewsletters = async (req, res) => {
    try {
        const newsletters = await Newsletter.find();
        res.status(200).json(newsletters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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

        // Your existing email sending logic here
        const subscribers = await Subscriber.find({ status: 'Subscribed' });
        let successful = 0;
        let failed = 0;

        for (const subscriber of subscribers) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: subscriber.email,
                    subject: newsletter.subject,
                    html: newsletter.content
                });
                successful++;
            } catch (error) {
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
        res.status(200).json(newsletter);
    } catch (error) {
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

        const formattedISTTime = istFormatter.format(scheduledTimeIST);

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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }

            body {
                background: #f8f9fa;
                color: #2d3748;
                line-height: 1.6;
            }

            .wrapper {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }

            .container {
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
            }

            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                padding: 40px 20px;
                text-align: center;
            }

            .header h1 {
                font-size: 2.5rem;
                font-weight: 800;
                margin-bottom: 15px;
                letter-spacing: -0.025em;
            }

            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
            }

            .blog-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
                padding: 24px;
            }

            .blog-card {
                background: #fff;
                border-radius: 12px;
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .blog-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }

            .blog-image {
                position: relative;
                width: 100%;
                height: 200px;
                overflow: hidden;
            }

            .blog-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .blog-card:hover .blog-image img {
                transform: scale(1.05);
            }

            .blog-content {
                padding: 20px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }

            .blog-title {
                font-size: 1.25rem;
                font-weight: 700;
                color: #1a202c;
                margin-bottom: 12px;
                line-height: 1.4;
            }

            .blog-meta {
                display: flex;
                align-items: center;
                gap: 16px;
                font-size: 0.875rem;
                color: #718096;
                margin-bottom: 12px;
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .blog-description {
                color: #4a5568;
                margin-bottom: 20px;
                flex-grow: 1;
            }

            .read-more {
                display: inline-flex;
                align-items: center;
                padding: 8px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                transition: opacity 0.3s ease;
                align-self: flex-start;
            }

            .read-more:hover {
                opacity: 0.9;
            }

            .footer {
                background: #2d3748;
                color: #e2e8f0;
                padding: 32px 20px;
                text-align: center;
            }

            .footer p {
                margin-bottom: 16px;
            }

            .unsubscribe {
                color: #90cdf4;
                text-decoration: none;
                font-weight: 500;
                transition: color 0.3s ease;
            }

            .unsubscribe:hover {
                color: #63b3ed;
            }

            @media (max-width: 768px) {
                .wrapper {
                    padding: 10px;
                }

                .header {
                    padding: 30px 15px;
                }

                .header h1 {
                    font-size: 2rem;
                }

                .blog-grid {
                    grid-template-columns: 1fr;
                    padding: 15px;
                }

                .blog-image {
                    height: 180px;
                }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>Featured Blog Posts</h1>
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
                                    ${blog.excerpt || blog.content.substring(0, 150)}...
                                </p>
                                <a href="${process.env.FRONTEND_URL}/blog/${blog.slug}" class="read-more">
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
                    <a href="${process.env.FRONTEND_URL}/unsubscribe" class="unsubscribe">
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
                scheduledFor: scheduledTimeUTC,
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
                            await transporter.sendMail({
                                from: process.env.EMAIL_USER || 'rahiman@projexino.com',
                                to: subscriber.email,
                                subject: newsletter.subject,
                                html: newsletter.content,
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
        const newsletters = await Newsletter.find({
            status: 'Scheduled',
            'metadata.scheduledFor': { $gt: new Date() }
        }).sort({ 'metadata.scheduledFor': 1 });

        // Convert scheduledFor times to IST for response
        const newslettersWithIST = newsletters.map(newsletter => {
            const scheduledForIST = new Date(newsletter.metadata.scheduledFor);
            scheduledForIST.setHours(scheduledForIST.getHours() + 5);
            scheduledForIST.setMinutes(scheduledForIST.getMinutes() + 30);

            const istOptions = {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };

            return {
                ...newsletter.toObject(),
                scheduledTimeIST: scheduledForIST.toLocaleString('en-IN', istOptions)
            };
        });

        res.status(200).json(newslettersWithIST);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

        // Generate HTML content with improved design
        const content = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            
            body {
                background: #f8f9fa;
                color: #2d3748;
                line-height: 1.6;
            }
            
            .wrapper {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .container {
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                padding: 40px 20px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: 800;
                margin-bottom: 15px;
            }
            
            .content {
                padding: 40px 20px;
                font-size: 1.1rem;
                color: #4a5568;
                text-align: justify;
            }
            
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            
            .button {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: opacity 0.3s;
            }
            
            .button:hover {
                opacity: 0.9;
            }
            
            .footer {
                background: #2d3748;
                color: #e2e8f0;
                padding: 32px 20px;
                text-align: center;
            }
            
            .footer p {
                margin-bottom: 16px;
            }
            
            .unsubscribe {
                color: #90cdf4;
                text-decoration: none;
            }
            
            .unsubscribe:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                
                <div class="content">
                    ${announcement}
                    
                    ${buttonText && buttonUrl ? `
                    <div class="button-container">
                        <a href="${buttonUrl}" class="button">${buttonText}</a>
                    </div>
                    ` : ''}
                </div>

                <div class="footer">
                    <p>Thank you for being part of our community!</p>
                    <p>You're receiving this email because you subscribed to our newsletter.</p>
                    <a href="${process.env.FRONTEND_URL}/unsubscribe" class="unsubscribe">
                        Unsubscribe from our newsletter
                    </a>
                </div>
            </div>
        </div>
    </body>
</html>`;

        // Create newsletter
        const newsletter = new Newsletter({
            title,
            subject,
            content,
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
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: subscriber.email,
                    subject: subject,
                    html: content
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

module.exports = {
    getNewsletters,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    getTotalNewslettersCount,
    getMonthlyNewsletterCounts,
    sendNewsletter,
    scheduleBlogNewsletter,
    getScheduledNewsletters,
    cancelScheduledNewsletter,
    sendAnnouncement
};