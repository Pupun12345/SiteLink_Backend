const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Job = require('../models/job');

// @desc    Get community feed (posts + jobs merged)
// @route   GET /api/community/feed
// @access  Private
exports.getCommunityFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = { isActive: true, approvalStatus: 'approved' };

    const [posts, jobs] = await Promise.all([
      Post.find(filter)
        .populate('postedBy', 'name profileImage')
        .populate('likes.userId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
      Job.find(filter)
        .populate('postedBy', 'name profileImage companyName')
        .populate('likes.userId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const formattedPosts = posts.map(post => ({
      type: 'post',
      _id: post._id,
      content: post.content,
      images: post.images,
      video: post.video,
      feeling: post.feeling,
      posterName: post.posterName,
      posterImage: post.posterImage,
      posterType: post.posterType,
      companyName: post.companyName,
      verification: post.verification,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
      likes: (post.likes || []).map(like => ({
        userId: like.userId?._id,
        userName: like.userId?.name,
      })),
    }));

    const formattedJobs = jobs.map(job => ({
      type: 'job',
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      salaryType: job.salaryType,
      isUrgent: job.isUrgent,
      duration: job.duration || null,
      description: job.description,
      experience: job.experience,
      workersNeeded: job.quantity,
      applicationsCount: job.applicationsCount,
      posterName: job.postedBy?.name || null,
      posterImage: job.postedBy?.profileImage || null,
      companyName: job.postedBy?.companyName || job.company,
      postedBy: job.postedBy?._id,
      likesCount: job.likesCount,
      commentsCount: job.commentsCount,
      createdAt: job.createdAt,
      likes: (job.likes || []).map(like => ({
        userId: like.userId?._id,
        userName: like.userId?.name,
      })),
    }));

    const items = [...formattedPosts, ...formattedJobs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        current: page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching community feed',
      error: error.message,
    });
  }
};


// @desc    Create a community post
// @route   POST /api/community/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content, feeling } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const images = req.files?.images
      ? req.files.images.map(file => file.path)
      : [];

    const video = req.files?.video?.[0]
      ? req.files.video[0].path
      : null;

    const postData = {
      content,
      feeling: feeling || null,
      postedBy: userId,
      posterName: user.name,
      posterImage: user.profileImage,
      posterType: user.userType,
      companyName: user.companyName || user.ownerName || null,
      images,
      video,
      verification: user.verificationStatus || 'unverified',
    };

    const post = await Post.create(postData);

    const populatedPost = await Post.findById(post._id)
      .populate('postedBy', 'name profileImage')
      .populate('likes.userId', 'name');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        _id: populatedPost._id,
        content: populatedPost.content,
        images: populatedPost.images,
        video: populatedPost.video,
        feeling: populatedPost.feeling,
        posterName: populatedPost.posterName,
        posterImage: populatedPost.posterImage,
        posterType: populatedPost.posterType,
        companyName: populatedPost.companyName,
        verification: populatedPost.verification,
        likesCount: populatedPost.likesCount,
        commentsCount: populatedPost.commentsCount,
        createdAt: populatedPost.createdAt,
        likes: populatedPost.likes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating post', error: error.message });
  }
};


// @desc    Like/Unlike a post
// @route   PUT /api/community/posts/:postId/like
// @access  Private
exports.likeUnlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const likeIndex = post.likes.findIndex(like => like.userId.toString() === userId.toString());

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      post.likes.push({
        userId: userId,
        likedAt: new Date(),
      });
      post.likesCount += 1;
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('postedBy', 'name profileImage')
      .populate('likes.userId', 'name');

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      data: {
        _id: updatedPost._id,
        likesCount: updatedPost.likesCount,
        likes: updatedPost.likes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error liking/unliking post',
      error: error.message,
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/community/posts/:postId
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.postedBy.toString() !== userId.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message,
    });
  }
};


// @desc    Add comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { comment, parentComment = null } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty',
      });
    }

    if (comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters',
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc || parentCommentDoc.postId.toString() !== postId) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        });
      }
    }

    // Create comment
    const newComment = await Comment.create({
      postId,
      userId,
      comment: comment.trim(),
      parentComment
    });

    await newComment.populate('userId', 'name profileImage userType verificationStatus');


    const responseData = {
      _id: newComment._id,
      comment: newComment.comment,
      userId: newComment.userId._id,
      userName: newComment.userId.name,
      userImage: newComment.userId.profileImage || null,
      userType: newComment.userId.userType,
      isVerified: newComment.userId.verificationStatus === 'verified',
      likesCount: newComment.likesCount,

      isEdited: newComment.isEdited,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt
    };

    res.status(201).json({
      success: true,
      message: parentComment ? 'Reply added successfully' : 'Comment added successfully',
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

// @desc    Update comment
// @route   PUT /api/posts/:postId/comments/:commentId
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty',
      });
    }

    if (comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters',
      });
    }


    const existingComment = await Comment.findOne({
      _id: commentId,
      postId,
      status: 'active'
    }).populate('userId', 'name profileImage userType verificationStatus');

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (existingComment.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
    }

    // Update comment
    existingComment.comment = comment.trim();
    existingComment.isEdited = true;
    existingComment.editedAt = new Date();
    await existingComment.save();

    const responseData = {
      _id: existingComment._id,
      comment: existingComment.comment,
      userId: existingComment.userId._id,
      userName: existingComment.userId.name,
      userImage: existingComment.userId.profileImage || null,
      userType: existingComment.userId.userType,
      isVerified: existingComment.userId.verificationStatus === 'verified',
      likesCount: existingComment.likesCount,

      isEdited: existingComment.isEdited,
      editedAt: existingComment.editedAt,
      createdAt: existingComment.createdAt,
      updatedAt: existingComment.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message,
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findOne({
      _id: commentId,
      postId,
      status: 'active'
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    comment.status = 'deleted';
    await comment.save();
    // await Comment.deleteOne({ _id: commentId });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message,
    });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
exports.getCommentsByPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    let sortCriteria = {};
    switch (sortBy) {
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'popular':
        sortCriteria = { likesCount: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({
      postId,
      parentComment: null,
      status: 'active'
    })
      .populate('userId', 'name profileImage userType verificationStatus')
      .populate({
        path: 'replies',
        match: { status: 'active' },
        populate: {
          path: 'userId',
          select: 'name profileImage userType verificationStatus'
        },
        options: { sort: { createdAt: 1 }, limit: 3 }
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments({
      postId,
      parentComment: null,
      status: 'active'
    });

    const transformedComments = comments.map(comment => ({
      _id: comment._id,
      comment: comment.comment,
      userId: comment.userId._id,
      userName: comment.userId.name,
      userImage: comment.userId.profileImage || null,
      userType: comment.userId.userType,
      isVerified: comment.userId.verificationStatus === 'verified',
      likesCount: comment.likesCount,

      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: comment.replies ? comment.replies.map(reply => ({
        _id: reply._id,
        comment: reply.comment,
        userId: reply.userId._id,
        userName: reply.userId.name,
        userImage: reply.userId.profileImage || null,
        userType: reply.userId.userType,
        isVerified: reply.userId.verificationStatus === 'verified',
        likesCount: reply.likesCount,
        isEdited: reply.isEdited,
        editedAt: reply.editedAt,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt
      })) : []
    }));

    res.status(200).json({
      success: true,
      data: transformedComments,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: totalComments,
        pages: Math.ceil(totalComments / parseInt(limit))
      },
      meta: {
        postContent: post.content.substring(0, 100),
        totalComments,
        sortBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message,
    });
  }
};
