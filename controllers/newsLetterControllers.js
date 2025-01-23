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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Inter', sans-serif;
            }
            
            body {
                background: #f5f5f5;
                color: #374151;
                line-height: 1.6;
            }
            
            .wrapper {
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .container {
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 25px 50px -12px rgba(25, 35, 77, 0.15);
                overflow: hidden;
                position: relative;
            }

            .container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 8px;
                background: linear-gradient(90deg, #2b5a9e, #19234d, #d9764a);
            }
            
            .header {
                background: linear-gradient(135deg, #2b5a9e 0%, #19234d 100%);
                color: #ffffff;
                padding: 70px 40px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                opacity: 0.1;
            }
            
            .header h1 {
                font-size: 3rem;
                font-weight: 800;
                margin-bottom: 20px;
                position: relative;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                letter-spacing: -0.5px;
            }

            .content {
                padding: 50px 40px;
                font-size: 1.1rem;
                color: #374151;
                line-height: 1.8;
                position: relative;
            }

            .content::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 40px;
                right: 40px;
                height: 1px;
                background: linear-gradient(90deg, transparent, #d1d5db 50%, transparent);
            }

            ${uploadedImages.length === 1 ? `
            .single-image-container {
                margin: 40px -40px;
                height: 450px;
                overflow: hidden;
                position: relative;
            }

            .single-image-container::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                box-shadow: inset 0 -100px 100px -100px rgba(0,0,0,0.1);
            }

            .single-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            ` : `
            .image-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 24px;
                margin: 40px 0;
            }

            .grid-image-container {
                height: 280px;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                position: relative;
            }

            .grid-image-container::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(0deg, rgba(25,35,77,0.05) 0%, rgba(25,35,77,0) 100%);
            }

            .grid-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            `}

            .button-container {
                text-align: center;
                margin: 50px 0;
            }
            
            .button {
                display: inline-block;
                padding: 16px 36px;
                background: linear-gradient(135deg, #de7527 0%, #d9764a 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 1.1rem;
                transition: all 0.3s ease;
                box-shadow: 0 10px 20px -5px rgba(222, 117, 39, 0.4);
                position: relative;
                overflow: hidden;
            }
            
            .button::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transform: translateX(-100%);
                transition: transform 0.5s ease;
            }
            
            .button:hover::after {
                transform: translateX(100%);
            }

            .footer {
                background: #19234d;
                color: #d1d5db;
                padding: 50px 40px;
                text-align: center;
                position: relative;
            }

            .footer::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            }
            
            .social-links {
                display: flex;
                justify-content: center;
                gap: 24px;
                margin-bottom: 40px;
            }
            
            .social-icon {
                width: 44px;
                height: 44px;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .social-icon::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .social-icon:hover::after {
                opacity: 1;
            }

            .footer p {
                margin-bottom: 20px;
                font-size: 1.05rem;
                opacity: 0.9;
            }
            
            .unsubscribe {
                color: #d9764a;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.3s ease;
                display: inline-block;
                padding: 10px 24px;
                border: 1px solid rgba(217, 118, 74, 0.3);
                border-radius: 12px;
                margin-top: 24px;
                position: relative;
                overflow: hidden;
            }
            
            .unsubscribe::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(217,118,74,0.1), transparent);
                transform: translateX(-100%);
                transition: transform 0.5s ease;
            }
            
            .unsubscribe:hover::after {
                transform: translateX(100%);
            }

            @media (max-width: 640px) {
                .wrapper {
                    padding: 12px;
                }
                
                .header {
                    padding: 50px 24px;
                }
                
                .header h1 {
                    font-size: 2.4rem;
                }
                
                .content {
                    padding: 40px 24px;
                }

                .single-image-container {
                    margin: 30px -24px;
                    height: 300px;
                }

                .image-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .footer {
                    padding: 40px 24px;
                }
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
                    
                    ${uploadedImages.length > 0 ?
                uploadedImages.length === 1 ?
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
                : ''}
                    
                    ${buttonText && buttonUrl ? `
                    <div class="button-container">
                        <a href="${buttonUrl}" class="button">${buttonText}</a>
                    </div>
                    ` : ''}
                </div>

                <div class="footer">
                    <div class="social-links">
                        <a href="#" class="social-icon">
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a href="#" class="social-icon">
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        </a>
                        <a href="#" class="social-icon">
                            <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                        </a>
                    </div>
                    <p>Thank you for being part of our community!</p>
                    <p>You're receiving this email because you subscribed to our newsletter.</p>
                    <a href="${process.env.FRONTEND_URL}/unsubscribe?email={{subscriberEmail}}" class="unsubscribe">
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
    // getTotalAnnouncementCount,
    // getAllNewsletters,
};