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
const upload = require('../middleware/upload');
const { handleUpload } = require('../middleware/upload');

// GET community feed
router.get('/feed', protect, getCommunityFeed);

// GET current user's own posts (must come before '/posts/:id...' routes)
router.get('/posts/mine', protect, getMyPosts);

// GET ek single post — shared deep link kholne par app isi ko call karti hai
// NOTE: ye ':postId' route se PEHLE hona chahiye, warna 'user' ko
// postId samajh liya jayega.
router.get('/posts/user/:userId', protect, getPostsByUser);

router.get('/posts/:postId', protect, getPostById);

// POST create post
router.post('/posts', protect, handleUpload(upload.fields([{ name: 'images', maxCount: 5 }, { name: 'video', maxCount: 1 }])), createPost);

// PUT like/unlike post
router.put('/posts/:postId/like', protect, likeUnlikePost);

// DELETE post
router.delete('/posts/:postId', protect, deletePost);

// Comment routes
router.post('/posts/:id/comments', protect, addComment);
router.put('/posts/:postId/comments/:commentId', protect, updateComment);
router.delete('/posts/:postId/comments/:commentId', protect, deleteComment);
router.get('/posts/:id/comments', protect, getCommentsByPost);

module.exports = router;