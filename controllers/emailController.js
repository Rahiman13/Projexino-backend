const nodemailer = require('nodemailer');
const Subscriber = require('../models/Subscriber');
const Blog =require('../models/blog')

const transporter = nodemailer.createTransport({
    service: 'Gmail', // or your email provider
    auth: {
        user: 'rahiman@projexino.com',
        pass: 'fhay qjga nyjt tczq',
        // pass: 'fhay qjga nyjt tczq',
    },
});

// Function to send newsletters
exports.sendNewsletter = async (req, res) => {
    try {
        const { subject, content } = req.body; // Get subject and content from the request body
        const subscribers = await Subscriber.find({ status: 'Subscribed' }); // Fetch all subscribed users

        if (subscribers.length === 0) {
            return res.status(404).json({ error: 'No subscribed users found' });
        }

        // Send email to all subscribers
        const emailPromises = subscribers.map(subscriber => {
            return transporter.sendMail({
                from: 'rahiman@projexino.com',
                to: subscriber.email,
                subject,
                html: content,
            });
        });

        // Wait for all emails to be sent
        await Promise.all(emailPromises);

        res.status(200).json({ message: 'Newsletter sent to all subscribers' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to send the latest blogs as a newsletter
// exports.sendLatestBlogs = async (req, res) => {
//     try {
//         const latestBlogs = await Blog.find().sort({ createdAt: -1 }).limit(5); // Get latest 5 blogs

//         if (latestBlogs.length === 0) {
//             return res.status(404).json({ error: 'No blogs found' });
//         }

//         // Generate HTML content for the newsletter
//         let content = '<h1>Latest Blogs</h1>';
//         latestBlogs.forEach(blog => {
//             content += `
//                 <div style="border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px;">
//                     <h2 style="color: #2a9d8f;">${blog.title}</h2>
//                     <p><strong>Author:</strong> ${blog.authorName}</p>
//                     <p><strong>Published on:</strong> ${new Date(blog.createdAt).toLocaleDateString()}</p>
//                     <p><strong>Description:</strong></p>
//                     <p>${blog.content}</p>
//                     <p><a href="${blog.slug}" style="color: #007bff;">Read More...</a></p>
//                 </div>
//             `;
//         });

//         // Send the newsletter with the latest blogs
//         await exports.sendNewsletter({ body: { subject: 'Latest Blogs', content } }, res);

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// Function to send the latest blogs as a newsletter
// exports.sendLatestBlogs = async (req, res) => {
//     try {
//         const latestBlogs = await Blog.find().sort({ createdAt: -1 }).limit(5); // Get latest 5 blogs

//         if (latestBlogs.length === 0) {
//             return res.status(404).json({ error: 'No blogs found' });
//         }

//         // Generate HTML content for the newsletter
//         let content = `
//             <html>
//                 <head>
//                     <style>
//                         body {
//                             font-family: Arial, sans-serif;
//                             background-color: #f4f4f9;
//                             color: #333;
//                             margin: 0;
//                             padding: 0;
//                         }
//                         .container {
//                             width: 100%;
//                             max-width: 600px;
//                             margin: 0 auto;
//                             padding: 20px;
//                             background-color: #fff;
//                             border-radius: 10px;
//                             box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
//                         }
//                         h1 {
//                             text-align: center;
//                             color: #2a9d8f;
//                         }
//                         .blog-post {
//                             margin-bottom: 30px;
//                             padding: 20px;
//                             border-radius: 8px;
//                             background-color: #f9f9f9;
//                             box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
//                         }
//                         .blog-title {
//                             font-size: 24px;
//                             color: #333;
//                             font-weight: bold;
//                         }
//                         .blog-meta {
//                             font-size: 14px;
//                             color: #888;
//                             margin-bottom: 10px;
//                         }
//                         .blog-description {
//                             font-size: 16px;
//                             line-height: 1.6;
//                             margin-bottom: 10px;
//                             color: #555;
//                         }
//                         .read-more {
//                             color: #007bff;
//                             text-decoration: none;
//                             font-weight: bold;
//                         }
//                         .footer {
//                             text-align: center;
//                             font-size: 14px;
//                             color: #888;
//                             margin-top: 20px;
//                         }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="container">
//                         <h1>Latest Blogs</h1>
//         `;

//         // Loop through blogs to add each blog's content into the email
//         latestBlogs.forEach(blog => {
//             content += `
//                 <div class="blog-post">
//                     <div class="blog-title">${blog.title}</div>
//                     <div class="blog-meta">Author: ${blog.authorName} | Published on: ${new Date(blog.createdAt).toLocaleDateString()}</div>
//                     <div class="blog-description">${blog.content}</div>
//                     <a href="${blog.slug}" class="read-more">Read More...</a>
//                 </div>
//             `;
//         });

//         content += `
//             <div class="footer">
//                 <p>Thank you for subscribing to our newsletter.</p>
//                 <p>If you no longer wish to receive these emails, please <a href="/unsubscribe" style="color: #007bff;">unsubscribe</a>.</p>
//             </div>
//         </div>
//         </body>
//         </html>
//         `;

//         // Send the newsletter with the latest blogs
//         await exports.sendNewsletter({ body: { subject: 'Latest Blogs', content } }, res);

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// Function to send the latest blogs as a newsletter
exports.sendLatestBlogs = async (req, res) => {
    try {
        const latestBlogs = await Blog.find().sort({ createdAt: -1 }).limit(5); // Get latest 5 blogs

        if (latestBlogs.length === 0) {
            return res.status(404).json({ error: 'No blogs found' });
        }

        function formatDate(date) {
            const d = new Date(date);
            const day = d.getDate();
            const month = d.toLocaleString('default', { month: 'short' });
            const year = d.getFullYear();

            // Adding the 'st', 'nd', 'rd', 'th' suffix
            let suffix = 'th';
            if (day === 1 || day === 21 || day === 31) suffix = 'st';
            else if (day === 2 || day === 22) suffix = 'nd';
            else if (day === 3 || day === 23) suffix = 'rd';

            return `${day}${suffix} ${month} ${year}`;
        }

        // Generate HTML content for the newsletter
        let content = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            background-color: #f4f4f9;
                            color: #333;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            width: 100%;
                            max-width: 750px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #ffffff;
                            border-radius: 12px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            text-align: center;
                            color: #2a9d8f;
                            font-size: 30px;
                            margin-bottom: 40px;
                            font-weight: bold;
                        }
                        .blog-card {
                            display: flex;
                            flex-direction: column;
                            background-color: #ffffff;
                            border-radius: 12px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                            margin-bottom: 30px;
                            overflow: hidden;
                            border: 1px solid #f0f0f0;
                            transition: transform 0.3s ease-in-out;
                        }
                        .blog-card:hover {
                            transform: translateY(-10px);
                        }
                        .blog-card img {
                            width: 100%;
                            height: 250px;
                            object-fit: cover;
                            border-bottom: 1px solid #f0f0f0;
                        }
                        .blog-content {
                            padding: 20px;
                            text-align: justify;
                        }
                        .blog-title {
                            font-size: 26px;
                            color: #333;
                            font-weight: bold;
                            margin-bottom: 15px;
                        }
                        .blog-meta {
                            font-size: 15px;
                            color: #888;
                            margin-bottom: 15px;
                        }
                        .blog-description {
                            font-size: 18px;
                            color: #555;
                            line-height: 1.6;
                            margin-bottom: 20px;
                        }
                        .read-more {
                            color: #ffffff;
                            text-decoration: none;
                            font-weight: bold;
                            display: inline-block;
                            padding: 12px 20px;
                            border-radius: 50px;
                            background-color: #2a9d8f;
                            transition: background-color 0.3s;
                        }
                        .read-more:hover {
                            background-color: #1f7e6a;
                        }
                        .footer {
                            text-align: center;
                            font-size: 14px;
                            color: #888;
                            margin-top: 50px;
                            padding-bottom: 20px;
                        }
                        .unsubscribe {
                            color: #2a9d8f;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Latest Blogs</h1>
        `;

        // Loop through blogs to add each blog's content into the email
        latestBlogs.forEach(blog => {
            content += `
                <div class="blog-card">
                    <img src="${blog.featuredImage}" alt="Blog Image">
                    <div class="blog-content">
                        <div class="blog-title">${blog.title}</div>
                        <div class="blog-meta">Author: ${blog.authorName} | Published on: ${formatDate(blog.createdAt)}</div>
                        <div class="blog-description">
                            ${blog.content.substring(0, 150)}...  <!-- Displaying first 150 chars of content -->
                        </div>
                        <a href="${blog.slug}" class="read-more">Read More</a>
                    </div>
                </div>
            `;
        });

        content += `
            <div class="footer">
                <p>Thank you for subscribing to our newsletter.</p>
                <p>If you no longer wish to receive these emails, please <a href="/unsubscribe" class="unsubscribe">unsubscribe</a>.</p>
            </div>
        </div>
        </body>
        </html>
        `;

        // Send the newsletter with the latest blogs as HTML content
        await exports.sendNewsletter({ body: { subject: 'Latest Blogs', content } }, res);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

