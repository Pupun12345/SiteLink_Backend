const express = require('express');
const router = express.Router();
const {
  getCommunityFeed,
  getMyPosts,
  getPostsByUser,
  getPostById,
  createPost,
  likeUnlikePost,
  deletePost,
  addComment,
  updateComment,
  deleteComment,
  getCommentsByPost,
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

// GET community feed
router.get('/feed', protect, getCommunityFeed);

router.get('/posts/mine', protect, getMyPosts);
router.get('/posts/user/:userId', protect, getPostsByUser);
router.get('/posts/:postId', protect, getPostById);

// POST create post — JSON body only (Cloudinary URLs from direct upload)
router.post('/posts', protect, createPost);

router.put('/posts/:postId/like', protect, likeUnlikePost);
router.delete('/posts/:postId', protect, deletePost);

// Comment routes
router.post('/posts/:id/comments', protect, addComment);
router.put('/posts/:postId/comments/:commentId', protect, updateComment);
router.delete('/posts/:postId/comments/:commentId', protect, deleteComment);
router.get('/posts/:id/comments', protect, getCommentsByPost);

module.exports = router;