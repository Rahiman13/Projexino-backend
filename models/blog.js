const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: {
        type: [{
            type: { type: String, enum: ['paragraph', 'heading', 'list', 'quote', 'code'] },
            level: { type: Number }, // For headings (h1-h6)
            items: [String], // For lists
            text: String, // For paragraphs, quotes, and code
            language: String // For code blocks
        }],
        required: true
    },
    authorName: { type: String, required: true },
    authorImage: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    category: { type: String, required: true },
    featuredImage: { type: String },
    status: { type: String, default: 'Draft' },
    publishedDate: { type: Date, default: null },
    excerpt: { type: String },
    seoMetadata: {
        metaTitle: { type: String },
        metaDescription: { type: String },
        keywords: { type: [String], default: [] },
    },
    comments: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            comment: { type: String },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    relatedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
    visibility: { type: String, default: 'Public' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
