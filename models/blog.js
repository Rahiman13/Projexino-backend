const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: {
        type: [{
            type: { type: String, enum: ['paragraph', 'heading', 'list', 'quote', 'code'] },
            level: { type: Number },
            items: [String],
            text: String,
            language: String
        }],
        required: true
    },
    authorName: { type: String, required: true },
    authorImage: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    category: { type: String, required: true },
    featuredImage: { type: String },
    imageAltText: { type: String }, // New
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

    // New fields
    breadcrumb: { type: [String], default: [] },
    livePageUrl: { type: String },
    topViewed: { type: Boolean, default: false },
    recentlyPublished: { type: Boolean, default: false },
    tocBasedOn: { type: String, enum: ['heading', 'custom'], default: 'heading' },
    audio: { type: String }, // e.g. URL to audio file
    featuredSections: [
        {
            heading: { type: String },
            description: { type: String },
            image: { type: String },
        }
    ],
    faqs: [
        {
            question: { type: String },
            answer: { type: String }
        }
    ],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
