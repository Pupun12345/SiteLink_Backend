const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const notifyUser = require('../utils/notifyUser');

// Feed/post me dikhne wala avatar.
//
// Vendor ki pehchaan uski company hai, isliye uska avatar company logo
// hota hai — wahi jo vendor profile screen par dikhta hai. Live logo ko
// snapshot se pehle rakhte hain: profile me logo badle to feed me turant
// dikhta hai, aur purani posts (jinke snapshot me vendor ka personal
// profileImage pada hai) apne aap theek ho jaati hain.
//
// Worker/admin par snapshot hi pehle — post jaisi thi waisi dikhe.
function posterAvatar(post, author) {
  if (post.posterType === 'vendor') {
    return author?.companyLogo || post.posterImage || author?.profileImage || null;
  }
  return post.posterImage || author?.profileImage || null;
}

// Feed, myPosts aur single-post — teeno ek hi shape bhejte hain, warna
// app ko har endpoint ke liye alag parsing likhni padti hai.
// `postedBy` populated ho to purani posts ke missing snapshots (jaise
// posterDesignation) live profile se bhar jaate hain.
function formatPost(post) {
  const author = post.postedBy && post.postedBy._id ? post.postedBy : null;
  return {
    type: 'post',
    _id: post._id,
    content: post.content,
    images: post.images,
    video: post.video,
    feeling: post.feeling,
    posterName: post.posterName,
    posterImage: posterAvatar(post, author),
    posterType: post.posterType,
    posterDesignation:
      post.posterDesignation ||
      author?.designation ||
      author?.primarySkill ||
      null,
    companyName: post.companyName || author?.companyName || null,
    verification: post.verification,
    approvalStatus: post.approvalStatus,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt,
    likes: (post.likes || []).map((like) => ({
      userId: like.userId?._id,
      userName: like.userId?.name,
    })),
  };
}

// @desc    Get community feed (posts + jobs merged)
// @route   GET /api/community/feed
// @access  Private
exports.getCommunityFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,
      approvalStatus: "approved",
    };

    const [posts, total] = await Promise.all([
      Post.aggregate([
        { $match: filter },
        { $addFields: {
          _dayBucket: { $dateTrunc: { date: '$createdAt', unit: 'day' } },
          _adminFirst: { $cond: [{ $eq: ['$posterType', 'admin'] }, 0, 1] },
        }},
        { $sort: { _dayBucket: -1, _adminFirst: 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'users', localField: 'postedBy', foreignField: '_id', as: 'postedBy' } },
        { $unwind: { path: '$postedBy', preserveNullAndEmptyArrays: true } },
      ]),
      Post.countDocuments(filter),
    ]);

    // Re-populate likes.userId for name (aggregate doesn't auto-populate)
    await Post.populate(posts, { path: 'likes.userId', select: 'name' });

    const formattedPosts = posts.map((post) => ({
      type: "post",
      _id: post._id,
      content: post.content,
      images: post.images,
      video: post.video,
      feeling: post.feeling,
      posterName: post.posterName,
      posterImage: posterAvatar(post, post.postedBy),
      posterType: post.posterType,
      posterDesignation:
        post.posterDesignation ||
        post.postedBy?.designation ||
        post.postedBy?.primarySkill ||
        null,
      companyName: post.companyName || post.postedBy?.companyName || null,
      verification: post.verification,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
      likes: (post.likes || []).map((like) => ({
        userId: like.userId?._id,
        userName: like.userId?.name,
      })),
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts,
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
      message: "Error fetching community feed",
      error: error.message,
    });
  }
};


// @desc    Get the current user's own posts (any approvalStatus/isActive —
//          owner should always see their own content, not just what's
//          currently live in the public feed)
// @route   GET /api/community/posts/mine
// @access  Private
exports.getMyPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { postedBy: req.user.id };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('likes.userId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    const formattedPosts = posts.map((post) => ({
      type: 'post',
      _id: post._id,
      content: post.content,
      images: post.images,
      video: post.video,
      feeling: post.feeling,
      posterName: post.posterName,
      posterImage: posterAvatar(post, req.user),
      posterType: post.posterType,
      // Apni hi posts hain — purani posts ke liye req.user se fallback.
      posterDesignation:
        post.posterDesignation ||
        req.user?.designation ||
        req.user?.primarySkill ||
        null,
      companyName: post.companyName || req.user?.companyName || null,
      verification: post.verification,
      approvalStatus: post.approvalStatus,
      isActive: post.isActive,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
      likes: (post.likes || []).map((like) => ({
        userId: like.userId?._id,
        userName: like.userId?.name,
      })),
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts,
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
      message: 'Error fetching your posts',
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

    const video = req.files?.video?.[0]?.path || null;

    // Text ya media — kuch to hona chahiye. Sirf photo wala post theek hai,
    // sirf video wala bhi; poora khaali nahi.
    const text = (content ?? '').toString().trim();
    if (!text && images.length === 0 && !video) {
      return res.status(400).json({
        success: false,
        message: 'Add some text, a photo or a video to post.',
      });
    }

    const postData = {
      content: text,
      feeling: feeling || null,
      postedBy: userId,
      posterName: user.name,
      // Vendor ka avatar company logo hai (feed/detail dono me), logo na
      // ho to profile photo. Worker/admin par profile photo hi.
      posterImage: user.userType === 'vendor'
        ? (user.companyLogo || user.profileImage)
        : user.profileImage,
      posterType: user.userType,
      // Vendor ke liye designation, worker ke liye primarySkill
      posterDesignation: user.designation || user.primarySkill || null,
      companyName: user.companyName || user.ownerName || null,
      images,
      video,
      verification: user.verificationStatus || "unverified",
      approvalStatus: "approved",
      approvedAt: new Date(),
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
        posterDesignation: populatedPost.posterDesignation,
        companyName: populatedPost.companyName,
        verification: populatedPost.verification,
        likesCount: populatedPost.likesCount,
        commentsCount: populatedPost.commentsCount,
        createdAt: populatedPost.createdAt,
        likes: populatedPost.likes,
        approvalStatus: populatedPost.approvalStatus,
        approvedAt: populatedPost.approvedAt
      },
    });
  } catch (error) {
    // Schema validation fail hona client ki galti hai, server ki nahi —
    // 500 dene se app "server down" jaisa generic error dikhata tha.
    if (error.name === 'ValidationError') {
      const first = Object.values(error.errors || {})[0];
      return res.status(400).json({
        success: false,
        message: first?.message || 'Invalid post data',
      });
    }
    res.status(500).json({ success: false, message: 'Error creating post', error: error.message });
  }
};


// @desc    Ek single post — shared link kholne par app isi se post
//          uthata hai (feed me wo post ho ya na ho, purani bhi ho sakti hai)
// @route   GET /api/community/posts/:postId
// @access  Private
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId)
      .populate(
        'postedBy',
        // companyLogo bhi — vendor ka avatar isi se banta hai (posterAvatar).
        'name profileImage companyLogo designation primarySkill companyName'
      )
      .populate('likes.userId', 'name');

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });
    }

    // Shared link se koi bhi aa sakta hai — jo post feed me nahi hai
    // (pending/rejected/hataayi hui) wo sirf uske apne malik ko dikhe.
    const isOwner = post.postedBy?._id?.toString() === req.user.id;
    const isLive = post.isActive && post.approvalStatus === 'approved';
    if (!isLive && !isOwner) {
      return res.status(404).json({
        success: false,
        message: 'This post is no longer available',
      });
    }

    res.status(200).json({ success: true, data: formatPost(post) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message,
    });
  }
};

// @desc    Like/Unlike a post
// @route   PUT /api/community/posts/:postId/like
// @access  Private
exports.likeUnlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId).select('likes postedBy');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const alreadyLiked = post.likes.some(like => like.userId.toString() === userId.toString());

    await Post.updateOne(
      { _id: postId },
      alreadyLiked
        ? { $pull: { likes: { userId } }, $inc: { likesCount: -1 } }
        : { $push: { likes: { userId, likedAt: new Date() } }, $inc: { likesCount: 1 } }
    );

    // Post owner ko sirf naye like par notify karo (unlike par nahi), apne
    // hi post par like karne par bhi nahi.
    if (!alreadyLiked && post.postedBy && post.postedBy.toString() !== userId.toString()) {
      const liker = await User.findById(userId).select('name');
      notifyUser(post.postedBy, {
        type: 'new_like',
        title: 'New Like',
        body: `${liker?.name || 'Someone'} liked your post.`,
        data: { postId: post._id.toString() },
      }).catch((e) => console.error('[likeUnlikePost] notifyUser failed:', e.message));
    }

    const updatedPost = await Post.findById(postId)
      .populate('postedBy', 'name profileImage')
      .populate('likes.userId', 'name');

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      data: {
        _id: updatedPost._id,
        likesCount: Math.max(0, updatedPost.likesCount),
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

    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

    await newComment.populate('userId', 'name profileImage userType verificationStatus');

    // Post owner ko notify karo — apne hi post par comment karne par nahi.
    if (post.postedBy && post.postedBy.toString() !== userId) {
      notifyUser(post.postedBy, {
        type: 'new_comment',
        title: 'New Comment',
        body: `${newComment.userId.name || 'Someone'} commented on your post.`,
        data: { postId: post._id, commentId: newComment._id },
      }).catch((e) => console.error('[addComment] notifyUser failed:', e.message));
    }

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

    if (comment.userId.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    comment.status = 'deleted';
    await comment.save();
    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: -1 } });

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
