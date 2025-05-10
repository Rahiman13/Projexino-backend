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

// exports.createBlog = async (req, res) => {
//     try {
//         const {
//             title,
//             slug,
//             content,
//             authorName,
//             tags,
//             category,
//             status = 'Draft',
//             seoMetadata,
//             excerpt,
//             visibility = 'Public',
//             relatedBlogs = [],
//             publishedDate,
//             readingTime,
//             isFeatured = false,
//             breadcrumb,
//             livePageUrl,
//             topViewed = false,
//             recentlyPublished = false,
//             imageAltText,
//             tocBasedOn,
//             audio,
//             featuredSections = [],
//             faqs = []
//         } = req.body;

//         // Parse content
//         let structuredContent;
//         try {
//             const contentArray = typeof content === 'string' ? JSON.parse(content) : content;
//             structuredContent = validateAndStructureContent(contentArray);
//         } catch (error) {
//             return res.status(400).json({ error: 'Invalid content format' });
//         }

//         // Upload images
//         let authorImageUrl = null;
//         let featuredImageUrl = null;

//         if (req.files?.authorImage) {
//             const authorImageResult = await new Promise((resolve, reject) => {
//                 cloudinary.uploader.upload_stream({ folder: 'authors' }, (err, result) => {
//                     if (err) reject(err); else resolve(result);
//                 }).end(req.files['authorImage'][0].buffer);
//             });
//             authorImageUrl = authorImageResult.secure_url;
//         }

//         if (req.files?.featuredImage) {
//             const featuredImageResult = await new Promise((resolve, reject) => {
//                 cloudinary.uploader.upload_stream({ folder: 'featured' }, (err, result) => {
//                     if (err) reject(err); else resolve(result);
//                 }).end(req.files['featuredImage'][0].buffer);
//             });
//             featuredImageUrl = featuredImageResult.secure_url;
//         }

//         const blog = new Blog({
//             title,
//             slug,
//             content: structuredContent,
//             authorName,
//             authorImage: authorImageUrl,
//             featuredImage: featuredImageUrl,
//             tags: tags?.split(',').map(tag => tag.trim()) || [],
//             category,
//             status,
//             seoMetadata: seoMetadata ? JSON.parse(seoMetadata) : {},
//             excerpt,
//             visibility,
//             relatedBlogs,
//             createdBy: req.user.id,
//             publishedDate: publishedDate ? new Date(publishedDate) : undefined,
//             readingTime,
//             isFeatured,
//             breadcrumb,
//             livePageUrl,
//             topViewed,
//             recentlyPublished,
//             imageAltText,
//             tocBasedOn,
//             audio,
//             featuredSections,
//             faqs
//         });

//         const savedBlog = await blog.save();
//         res.status(201).json({ message: 'Blog created successfully!', blog: savedBlog });
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
            status = 'Draft',
            seoMetadata,
            excerpt,
            visibility = 'Public',
            relatedBlogs,
            publishedDate,
            readingTime,
            isFeatured = false,
            breadcrumb,
            livePageUrl,
            topViewed = false,
            recentlyPublished = false,
            imageAltText,
            tocBasedOn,
            audio,
            featuredSections,
            faqs
        } = req.body;

        // Parse content
        let structuredContent;
        try {
            const contentArray = typeof content === 'string' ? JSON.parse(content) : content;
            structuredContent = validateAndStructureContent(contentArray);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid content format' });
        }

        // Parse structured fields
        const parsedSeoMetadata = seoMetadata ? JSON.parse(seoMetadata) : {};
        const parsedFeaturedSections = featuredSections ? JSON.parse(featuredSections) : [];
        const parsedFaqs = faqs ? JSON.parse(faqs) : [];
        // const parsedAudio = audio ? JSON.parse(audio) : {};
        // const parsedBreadcrumb = breadcrumb ? JSON.parse(breadcrumb) : [];
        const parsedRelatedBlogs = relatedBlogs ? JSON.parse(relatedBlogs) : [];

        // Upload images
        let authorImageUrl = null;
        let featuredImageUrl = null;

        if (req.files?.authorImage) {
            const authorImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'authors' }, (err, result) => {
                    if (err) reject(err); else resolve(result);
                }).end(req.files['authorImage'][0].buffer);
            });
            authorImageUrl = authorImageResult.secure_url;
        }

        if (req.files?.featuredImage) {
            const featuredImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'featured' }, (err, result) => {
                    if (err) reject(err); else resolve(result);
                }).end(req.files['featuredImage'][0].buffer);
            });
            featuredImageUrl = featuredImageResult.secure_url;
        }

        const blog = new Blog({
            title,
            slug,
            content: structuredContent,
            authorName,
            authorImage: authorImageUrl,
            featuredImage: featuredImageUrl,
            tags: tags?.split(',').map(tag => tag.trim()) || [],
            category,
            status,
            seoMetadata: parsedSeoMetadata,
            excerpt,
            visibility,
            relatedBlogs: parsedRelatedBlogs,
            createdBy: req.user.id,
            publishedDate: publishedDate ? new Date(publishedDate) : undefined,
            readingTime,
            isFeatured,
            breadcrumb: breadcrumb?.split(',').map(breadcrumb => breadcrumb.trim()) || [],
            livePageUrl,
            topViewed,
            recentlyPublished,
            imageAltText,
            tocBasedOn,
            audio,
            featuredSections: parsedFeaturedSections,
            faqs: parsedFaqs
        });

        const savedBlog = await blog.save();
        res.status(201).json({ message: 'Blog created successfully!', blog: savedBlog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// exports.createBlog = async (req, res) => {
//     try {
//         // Validate required fields
//         const requiredFields = ['title', 'slug', 'content', 'authorName', 'category'];
//         const missingFields = requiredFields.filter(field => !req.body[field]);
//         if (missingFields.length > 0) {
//             return res.status(400).json({ 
//                 error: `Missing required fields: ${missingFields.join(', ')}` 
//             });
//         }

//         // Check slug uniqueness
//         const existingBlog = await Blog.findOne({ slug: req.body.slug });
//         if (existingBlog) {
//             return res.status(400).json({ error: 'Slug must be unique' });
//         }

//         const {
//             title,
//             slug,
//             content,
//             authorName,
//             tags,
//             category,
//             status = 'Draft',
//             seoMetadata,
//             excerpt,
//             visibility = 'Public',
//             relatedBlogs,
//             publishedDate,
//             readingTime,
//             isFeatured = false,
//             breadcrumb,
//             livePageUrl,
//             topViewed = false,
//             recentlyPublished = false,
//             imageAltText,
//             tocBasedOn = 'heading',
//             audio,
//             featuredSections,
//             faqs
//         } = req.body;

//         // Validate content
//         let structuredContent;
//         try {
//             const contentArray = typeof content === 'string' ? JSON.parse(content) : content;
//             structuredContent = validateAndStructureContent(contentArray);
//             if (structuredContent.length === 0) {
//                 return res.status(400).json({ error: 'Content cannot be empty' });
//             }
//         } catch (error) {
//             return res.status(400).json({ error: 'Invalid content format' });
//         }

//         // Parse structured fields with error handling
//         let parsedFields;
//         try {
//             parsedFields = {
//                 seoMetadata: seoMetadata ? JSON.parse(seoMetadata) : {},
//                 featuredSections: featuredSections ? JSON.parse(featuredSections) : [],
//                 faqs: faqs ? JSON.parse(faqs) : [],
//                 audio: audio ? JSON.parse(audio) : null,
//                 breadcrumb: breadcrumb ? JSON.parse(breadcrumb) : [],
//                 relatedBlogs: relatedBlogs ? JSON.parse(relatedBlogs) : []
//             };
//         } catch (parseError) {
//             return res.status(400).json({ error: 'Invalid JSON in one or more fields' });
//         }

//         // Handle image uploads
//         let authorImageUrl = null;
//         let featuredImageUrl = null;

//         try {
//             if (req.files?.authorImage) {
//                 // Validate image first
//                 const authorImage = req.files['authorImage'][0];
//                 if (!authorImage.mimetype.startsWith('image/')) {
//                     return res.status(400).json({ error: 'Author image must be an image file' });
//                 }
                
//                 const authorImageResult = await cloudinary.uploader.upload(authorImage.path, {
//                     folder: 'authors',
//                     resource_type: 'image'
//                 });
//                 authorImageUrl = authorImageResult.secure_url;
//             }

//             if (req.files?.featuredImage) {
//                 const featuredImage = req.files['featuredImage'][0];
//                 if (!featuredImage.mimetype.startsWith('image/')) {
//                     return res.status(400).json({ error: 'Featured image must be an image file' });
//                 }
                
//                 const featuredImageResult = await cloudinary.uploader.upload(featuredImage.path, {
//                     folder: 'featured',
//                     resource_type: 'image'
//                 });
//                 featuredImageUrl = featuredImageResult.secure_url;
//             }
//         } catch (uploadError) {
//             return res.status(500).json({ error: 'Error uploading images' });
//         }

//         // Calculate reading time if not provided (approx 200 words per minute)
//         const calculatedReadingTime = readingTime || 
//             Math.ceil(structuredContent.reduce((acc, block) => {
//                 const text = block.text || block.items?.join(' ') || '';
//                 return acc + (text.split(/\s+/).length || 0);
//             }, 0) / 200);

//         const blog = new Blog({
//             title,
//             slug,
//             content: structuredContent,
//             authorName,
//             authorImage: authorImageUrl,
//             featuredImage: featuredImageUrl,
//             tags: tags?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
//             category,
//             status,
//             seoMetadata: parsedFields.seoMetadata,
//             excerpt: excerpt || `${structuredContent[0].text?.substring(0, 160)}...` || '',
//             visibility,
//             relatedBlogs: parsedFields.relatedBlogs,
//             createdBy: req.user.id,
//             publishedDate: status === 'Published' ? 
//                 (publishedDate ? new Date(publishedDate) : new Date()) : 
//                 null,
//             readingTime: calculatedReadingTime,
//             isFeatured,
//             breadcrumb: breadcrumb?.split(',').map(breadcrumb => breadcrumb.trim()).filter(breadcrumb => breadcrumb) || [],
//             livePageUrl,
//             topViewed,
//             recentlyPublished,
//             imageAltText,
//             tocBasedOn,
//             audio: parsedFields.audio,
//             featuredSections: parsedFields.featuredSections,
//             faqs: parsedFields.faqs
//         });

//         const savedBlog = await blog.save();
//         res.status(201).json({ 
//             message: 'Blog created successfully!', 
//             blog: savedBlog 
//         });
//     } catch (error) {
//         console.error('Error creating blog:', error);
//         res.status(500).json({ 
//             error: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };


// Helper function to validate and structure content
const validateAndStructureContent = (contentArray) => {
    if (!Array.isArray(contentArray)) {
        throw new Error('Content must be an array of content blocks');
    }

    return contentArray.map(block => {
        if (!block || !block.type) {
            return null;
        }

        switch (block.type) {
            case 'paragraph':
                return {
                    type: 'paragraph',
                    text: block.text || ''
                };
            case 'heading':
                return {
                    type: 'heading',
                    level: Math.min(Math.max(parseInt(block.level) || 1, 1), 6),
                    text: block.text || ''
                };
            case 'list':
                return {
                    type: 'list',
                    items: Array.isArray(block.items) ? block.items.filter(item => typeof item === 'string') : []
                };
            case 'quote':
                return {
                    type: 'quote',
                    text: block.text || ''
                };
            case 'code':
                return {
                    type: 'code',
                    text: block.text || '',
                    language: block.language || 'plaintext'
                };
            default:
                return null;
        }
    }).filter(block => block !== null);
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
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

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
            publishedDate,
            readingTime,
            isFeatured,
            breadcrumb,
            livePageUrl,
            topViewed,
            recentlyPublished,
            imageAltText,
            tocBasedOn,
            audio,
            // featuredSections,
            faqs,
            relatedBlogs
        } = req.body;

        let structuredContent;
        try {
            const contentArray = typeof content === 'string' ? JSON.parse(content) : content;
            structuredContent = validateAndStructureContent(contentArray);
        } catch {
            return res.status(400).json({ error: 'Invalid content format' });
        }

        const parsedFaqs = faqs ? JSON.parse(faqs) : [];


        let authorImageUrl = req.body.authorImage || null;
        let featuredImageUrl = req.body.featuredImage || null;

        if (req.files?.authorImage) {
            const authorImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'authors' }, (err, result) => {
                    if (err) reject(err); else resolve(result);
                }).end(req.files['authorImage'][0].buffer);
            });
            authorImageUrl = authorImageResult.secure_url;
        }

        if (req.files?.featuredImage) {
            const featuredImageResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ folder: 'featured' }, (err, result) => {
                    if (err) reject(err); else resolve(result);
                }).end(req.files['featuredImage'][0].buffer);
            });
            featuredImageUrl = featuredImageResult.secure_url;
        }

        const updateData = {
            title,
            slug,
            content: structuredContent,
            authorName,
            tags: tags?.split(',').map(tag => tag.trim()) || [],
            category,
            status,
            seoMetadata: seoMetadata ? JSON.parse(seoMetadata) : {},
            excerpt,
            visibility,
            publishedDate: publishedDate ? new Date(publishedDate) : undefined,
            readingTime,
            isFeatured,
            breadcrumb: breadcrumb?.split(',').map(breadcrumb => breadcrumb.trim()) || [],
            livePageUrl,
            topViewed,
            recentlyPublished,
            imageAltText,
            tocBasedOn,
            audio,
            // featuredSections,
            faqs: parsedFaqs,
            relatedBlogs,
            updatedAt: Date.now(),
        };

        if (authorImageUrl) updateData.authorImage = authorImageUrl;
        if (featuredImageUrl) updateData.featuredImage = featuredImageUrl;

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedBlog) return res.status(404).json({ error: 'Blog not found' });
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

// View counts
exports.updateViewCount = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );
        res.status(200).json({ views: blog.views });
    } catch (error) {
        res.status(500).json({ message: 'Error updating view count' });
    }
};