const express = require('express');
const { listPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');
const { createComment } = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', listPosts);
router.post('/', requireAuth, createPost);
router.get('/:id', getPost);
router.put('/:id', requireAuth, updatePost);
router.delete('/:id', requireAuth, deletePost);
router.post('/:postId/comments', requireAuth, createComment);

module.exports = router;
