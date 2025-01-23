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
        let content = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        /* Modern Reset */
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        /* Base Styles */
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f8f9fa;
                        }

                        /* Container */
                        .wrapper {
                            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                            padding: 40px 20px;
                        }
                        
                        .container {
                            max-width: 800px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            border-radius: 16px;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            overflow: hidden;
                        }

                        /* Header */
                        .header {
                            background: linear-gradient(to right, #2563eb, #7c3aed);
                            color: white;
                            padding: 40px;
                            text-align: center;
                        }

                        .header h1 {
                            font-size: 32px;
                            font-weight: 700;
                            margin-bottom: 15px;
                            letter-spacing: -0.5px;
                        }

                        .header p {
                            font-size: 18px;
                            opacity: 0.9;
                        }

                        /* Content Area */
                        .content {
                            padding: 40px;
                        }

                        /* Blog Cards */
                        .blog-grid {
                            display: grid;
                            gap: 30px;
                            margin-top: 30px;
                        }

                        .blog-card {
                            background: #ffffff;
                            border-radius: 12px;
                            overflow: hidden;
                            transition: transform 0.3s ease;
                            border: 1px solid #e5e7eb;
                        }

                        .blog-card:hover {
                            transform: translateY(-5px);
                        }

                        .blog-image {
                            position: relative;
                            padding-top: 56.25%; /* 16:9 Aspect Ratio */
                            overflow: hidden;
                        }

                        .blog-image img {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            transition: transform 0.3s ease;
                        }

                        .blog-content {
                            padding: 24px;
                        }

                        .blog-title {
                            font-size: 24px;
                            font-weight: 600;
                            color: #1f2937;
                            margin-bottom: 12px;
                            line-height: 1.3;
                        }

                        .blog-meta {
                            font-size: 14px;
                            color: #6b7280;
                            margin-bottom: 16px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }

                        .blog-description {
                            color: #4b5563;
                            margin-bottom: 20px;
                            font-size: 16px;
                            line-height: 1.6;
                        }

                        .read-more {
                            display: inline-block;
                            padding: 12px 24px;
                            background: linear-gradient(to right, #2563eb, #7c3aed);
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 500;
                            transition: all 0.3s ease;
                        }

                        .read-more:hover {
                            opacity: 0.9;
                            transform: translateY(-2px);
                        }

                        /* Footer */
                        .footer {
                            background-color: #f8fafc;
                            padding: 30px;
                            text-align: center;
                            border-top: 1px solid #e5e7eb;
                        }

                        .footer p {
                            color: #6b7280;
                            font-size: 14px;
                        }

                        .unsubscribe {
                            color: #4f46e5;
                            text-decoration: none;
                            font-weight: 500;
                        }

                        .unsubscribe:hover {
                            text-decoration: underline;
                        }

                        /* Responsive Design */
                        @media (max-width: 768px) {
                            .container {
                                margin: 10px;
                            }
                            
                            .header {
                                padding: 30px 20px;
                            }

                            .content {
                                padding: 20px;
                            }

                            .blog-title {
                                font-size: 20px;
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
                            
                            <div class="content">
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
                                                    <span>📅 ${new Date(blog.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}</span>
                                                    ${blog.authorName ? `<span>👤 ${blog.authorName}</span>` : ''}
                                                </div>
                                                <p class="blog-description">
                                                    ${blog.excerpt || blog.content.substring(0, 150)}...
                                                </p>
                                                <a href="${process.env.FRONTEND_URL}/blog/${blog.slug}" 
                                                   class="read-more">
                                                    Read More
                                                </a>
                                            </div>
                                        </article>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="footer">
                                <p>
                                    You're receiving this email because you subscribed to our newsletter. 
                                    <br>
                                    <a href="${process.env.FRONTEND_URL}/unsubscribe" class="unsubscribe">
                                        Unsubscribe here
                                    </a>
                                </p>
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
    cancelScheduledNewsletter
};