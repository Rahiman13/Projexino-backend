// const express = require('express');
// const router = express.Router();
// const {
//     createBlog,
//     getBlogs,
//     getBlogById,
//     updateBlog,
//     deleteBlog,
//     getBlogCountsByMonth,
//     getAllBlogCounts
// } = require('../controllers/blogController');
// const authenticateUser = require('../middlewares/authMiddleware');

// // Blog Routes
// router.get('/counts', getAllBlogCounts); // Get all blog counts
// router.get('/count/:year', getBlogCountsByMonth); // Get blog counts by month for a selected year

// router.post('/', authenticateUser, createBlog); // Only authenticated users can create a blog
// router.get('/', getBlogs);                      // Anyone can get blogs
// router.get('/:id', getBlogById);                // Anyone can view a blog
// router.put('/:id', authenticateUser, updateBlog); // Only authenticated users can update a blog
// router.delete('/:id', authenticateUser, deleteBlog); // Only authenticated users can delete a blog


// module.exports = router;


const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multerConfig');
const {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    getBlogCountsByMonth,
    getAllBlogCounts,
} = require('../controllers/blogController');
const authenticateUser = require('../middlewares/authMiddleware');

// Blog Routes
router.get('/counts', getAllBlogCounts);
router.get('/count/:year', getBlogCountsByMonth);

// router.post('/', authenticateUser, upload.single('authorImage'), createBlog);
router.post(
    '/',
    authenticateUser, // Ensure authenticateUser is applied here
    upload.fields([{ name: 'authorImage', maxCount: 1 }, { name: 'featuredImage', maxCount: 1 }]),
    createBlog
);
router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.put(
    '/:id',
    authenticateUser,
    upload.fields([{ name: 'authorImage', maxCount: 1 }, { name: 'featuredImage', maxCount: 1 }]),
    updateBlog
);
router.delete('/:id', authenticateUser, deleteBlog);

module.exports = router;
