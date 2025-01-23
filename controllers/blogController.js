const Blog = require('../models/blog');
const User = require('../models/User'); // Import the User model
// const cloudinary = require('cloudinary').v2; // Import Cloudinary
const cloudinary = require('../config/cloudinaryConfig');

// Create a Blog
// exports.createBlog = async (req, res) => {
//     try {
//         const userId = req.userId; // Assuming `userId` is retrieved from middleware after token validation
//         const {
//             title,
//             slug,
//             content,
//             authorName,
//             authorImage,
//             tags,
//             category,
//             featuredImage,
//             status = 'Draft', // Default to 'Draft'
//             seoMetadata,
//             excerpt,
//             visibility = 'Public', // Default to 'Public'
//         } = req.body;

//         const blog = new Blog({
//             title,
//             slug,
//             content,
//             authorName, // Name of the author, not tied to the User model
//             authorImage, // Image of the author, not tied to the User model
//             createdBy: userId, // Logged-in user who created the blog
//             tags,
//             category,
//             featuredImage,
//             status,
//             seoMetadata,
//             excerpt,
//             visibility,
//         });

//         const savedBlog = await blog.save();
//         res.status(201).json(savedBlog);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

exports.createBlog = async (req, res) => {
    try {
        const {
            title,
            slug,
            content,
            authorName,
            tags,
            category,
            status = 'Draft', // Default to 'Draft'
            seoMetadata,
            excerpt,
            visibility = 'Public', // Default to 'Public'
            relatedBlogs = [],
        } = req.body;

        // Upload images to Cloudinary
        let authorImageUrl = null;
        let featuredImageUrl = null;

        if (req.files && req.files['authorImage']) {
            const authorImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'authors' }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }).end(req.files['authorImage'][0].buffer);
            });
            authorImageUrl = authorImageResult.secure_url;
        }

        if (req.files && req.files['featuredImage']) {
            const featuredImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'featured' }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }).end(req.files['featuredImage'][0].buffer);
            });
            featuredImageUrl = featuredImageResult.secure_url;
        }

        // Create the blog
        const blog = new Blog({
            title,
            slug,
            content,
            authorName,
            authorImage: authorImageUrl,
            featuredImage: featuredImageUrl,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [], // Convert comma-separated tags to an array
            category,
            status,
            seoMetadata: seoMetadata ? JSON.parse(seoMetadata) : {}, // Parse if passed as JSON string
            excerpt,
            visibility,
            relatedBlogs,
            createdBy: req.user.id, // Use the user ID from the token (set in middleware)
        });

        const savedBlog = await blog.save();
        res.status(201).json({ message: 'Blog created successfully!', blog: savedBlog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Get All Blogs
exports.getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate('createdBy', 'name email role') // Populate user details
            .sort({ createdAt: -1 }); // Sort by newest first
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Single Blog by ID
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('createdBy', 'name email role'); // Populate user details

        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a Blog
// exports.updateBlog = async (req, res) => {
//     try {
//         const {
//             title,
//             slug,
//             content,
//             authorName,
//             authorImage,
//             tags,
//             category,
//             featuredImage,
//             status,
//             seoMetadata,
//             excerpt,
//             visibility,
//         } = req.body;

//         const updatedBlog = await Blog.findByIdAndUpdate(
//             req.params.id,
//             {
//                 title,
//                 slug,
//                 content,
//                 authorName,
//                 authorImage,
//                 tags,
//                 category,
//                 featuredImage,
//                 status,
//                 seoMetadata,
//                 excerpt,
//                 visibility,
//                 updatedAt: Date.now(), // Update the timestamp
//             },
//             { new: true, runValidators: true } // Return updated document and run schema validators
//         );

//         if (!updatedBlog) return res.status(404).json({ error: 'Blog not found' });
//         res.status(200).json(updatedBlog);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

exports.updateBlog = async (req, res) => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            title,
            slug,
            content,
            authorName,
            tags,
            category,
            status,
            seoMetadata,
            excerpt,
            visibility,
        } = req.body;

        // Handle image fields if present
        let authorImageUrl = req.body.authorImage || null;
        let featuredImageUrl = req.body.featuredImage || null;

        if (req.files && req.files['authorImage']) {
            const authorImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'authors' }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }).end(req.files['authorImage'][0].buffer);
            });
            authorImageUrl = authorImageResult.secure_url;
        }

        if (req.files && req.files['featuredImage']) {
            const featuredImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'featured' }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }).end(req.files['featuredImage'][0].buffer);
            });
            featuredImageUrl = featuredImageResult.secure_url;
        }

        // Prepare the update object dynamically
        const updateData = {
            title,
            slug,
            content,
            authorName,
            tags,
            category,
            status,
            seoMetadata,
            excerpt,
            visibility,
            updatedAt: Date.now(),
        };

        if (authorImageUrl) updateData.authorImage = authorImageUrl;
        if (featuredImageUrl) updateData.featuredImage = featuredImageUrl;

        // Update the blog in the database
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        res.status(200).json(updatedBlog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Delete a Blog
exports.deleteBlog = async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedBlog) return res.status(404).json({ error: 'Blog not found' });
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getBlogCountsByMonth = async (req, res) => {
    try {
        const year = parseInt(req.params.year);

        if (isNaN(year)) {
            return res.status(400).json({ error: 'Invalid year provided' });
        }

        const monthlyCounts = [];

        for (let month = 0; month < 12; month++) {
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 1);

            const count = await Blog.countDocuments({
                createdAt: { $gte: startOfMonth, $lt: endOfMonth },
            });

            monthlyCounts.push({ month: month + 1, count });
        }

        res.status(200).json(monthlyCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAllBlogCounts = async (req, res) => {
    try {
        const totalBlogs = await Blog.countDocuments();
        const activeBlogs = await Blog.countDocuments({ status: 'Published' });
        const inactiveBlogs = await Blog.countDocuments({ status: 'Draft' });

        res.status(200).json({
            totalBlogs,
            activeBlogs,
            inactiveBlogs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
