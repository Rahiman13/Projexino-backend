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
    updateViewCount,
} = require('../controllers/blogController');
const authenticateUser = require('../middlewares/authMiddleware');

// Blog Routes
router.get('/counts', getAllBlogCounts);
router.get('/count/:year', getBlogCountsByMonth);

router.post(
    '/',
    authenticateUser,
    upload.fields([
        { name: 'authorImage', maxCount: 1 },
        { name: 'featuredImage', maxCount: 1 }
    ]),
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

// View counts
router.put('/:id/view', updateViewCount);

module.exports = router;
