// const cron = require('node-cron');
// const Blog = require('../models/blog');
// const { sendNewsletter } = require('./emailController');

// // Schedule to run on the first day of every month
// cron.schedule('0 0 1 * *', async () => {
//     const latestBlogs = await Blog.find().sort({ createdAt: -1 }).limit(5);
//     const content = latestBlogs.map(blog => `${blog.title}: ${blog.slug}`).join('\n');
    
//     await sendNewsletter({ body: { subject: 'Latest Blogs', content } });
// });
