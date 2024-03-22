const Post = require("../model/postModel");
const Comment = require("../model/commentModel");
const { EncryptField, DecryptField } = require("../utils/Encryption");

// @desc Create a new post
// @route GET /api/posts/createPost
// @access private
const createNewPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imagesPath = req.files?.images;
    if (!imagesPath) {
      return res
        .status(400)
        .json({ message: "No images present add at least one image " });
    }

    // extract image paths to an image array
    const imageArray = imagesPath.map((obj) => obj.path);
    console.log(imageArray);

    // encrypt content
    const encryptedData = await EncryptField(content);

    // create new post
    const newPost = await Post.create({
      content: encryptedData,
      images: imageArray,
      userId: req.user.id,
    });

    return res.status(201).json(newPost);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

// @desc Get a post by id
// @route GET /api/posts/post/:id
// @access private
const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    // get post
    let post = await Post.findById({ _id: id }).select("content images likes");
    if (!post) return res.status(400).json({ message: "Post not found" });

    // get comments for the post
    let comments = await Comment.find({ postId: post._id }).select(
      "content userId"
    );

    // decrypt post content
    post.content = await DecryptField(post.content);

    // Decrypt content of each comment
    for (let i = 0; i < comments.length; i++) {
      try {
        const decryptedContent = await DecryptField(comments[i].content);
        comments[i].content = decryptedContent;
      } catch (error) {
        console.error("Error decrypting comment content:", error.message);
        return res.status(400).json({ message: error.message });
      }
    }

    const postData = {
      post,
      comments,
    };

    return res.status(200).json(postData);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

// @desc Like post
// @route GET /api/posts/like/:id
// @access private
const likePost = async (req, res) => {
  try {
    const post = await Post.find({ _id: req.params.id, likes: req.user.id });

    if (post.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already likes this post" });
    }

    const like = await Post.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { likes: req.user.id } },
      { new: true }
    );

    if (!like) return res.status(404).json({ message: "Post does not exist" });

    return res.status(200).json({ message: "Post liked successfully" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

// @desc Delete a post
// @route GET /api/posts/deletePost/:id
// @access private
const deletePost = async (req, res) => {
  try {
    const { id: postID } = req.params;
    const { id: userID } = req.user;

    // find post
    const post = await Post.findById({ _id: postID });
    if (!post) return res.status(404).json({ message: "Post not found" });

    // check if the post post belongs to the user or not
    if (post.userId.toString() !== userID)
      return res
        .status(403)
        .json({ message: "Post does not belongs to the user" });

    await Post.findByIdAndDelete({ _id: postID });

    // find add comments
    const comments = await Comment.find({ postId: postID }).select(
      "content userId"
    );

    await Comment.deleteMany({ postId: postID });

    return res.status(200).json({ message: "Post successfully deleted" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

// @desc Update a post
// @route GET /api/posts/updatePost/:id
// @access private
const updatePost = async (req, res) => {
  try {
    const { id: postID } = req.params;
    const { id: userID } = req.user;
    const { content } = req.body;

    // find post
    const post = await Post.findById({ _id: postID });
    if (!post) return res.status(403).json({ message: "Post not found" });

    // check if the post post belongs to the user or not
    if (post.userId.toString() !== userID)
      return res
        .status(404)
        .json({ message: "Post does not belongs to the user" });

    let imagesPath = req.files?.images;
    if (!imagesPath) {
      return res
        .status(400)
        .json({ message: "No images present add at least one image " });
    }

    // extract image paths to an image array
    const imageArray = imagesPath.map((obj) => obj.path);

    // encrypt content
    const encryptedData = await EncryptField(content);

    // update post
    const updatedPost = await Post.findOneAndUpdate({
      content: encryptedData,
      images: imageArray,
      userId: req.user.id,
    });

    return res.status(200).json({ message: "Post updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @desc Add a new comment to a post
// @route GET /api/posts/addComment/:id
// @access private
const addComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { id: userId } = req.user;
    const { content } = req.body;

    if (!content)
      return res.status(400).json({ message: "Please add the comment" });

    // find post by id
    const post = await Post.findById({ _id: postId });

    // if post not found return
    if (!post) return res.status(404).json({ message: "Post not found" });

    const encryptedData = await EncryptField(content);

    // if post found add comment
    const comm = await Comment.create({
      content: encryptedData,
      userId,
      postId,
    });

    return res.status(201).json(comm);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

// @desc Delete a comment
// @route GET /api/posts/deleteComment/:postID/:commentID
// @access private
const deleteComment = async (req, res) => {
  try {
    const { postID, commentID } = req.params;
    const { id: userID } = req.user;

    // find post
    const post = await Post.find({ _id: postID });
    if (!post) return res.status(404).json({ message: "Post not found" });

    // find comment
    const comment = await Comment.find({ _id: commentID });
    if (!comment[0])
      return res.status(404).json({ message: "Comment not found" });

    // check if the comment belongs to the post or not
    if (comment[0].postId.toString() !== postID)
      return res
        .status(400)
        .json({ message: "Comment does not belong to the post" });

    // check if the comment belongs to the user or not
    if (comment[0].userId.toString() !== userID)
      return res
        .status(400)
        .json({ message: "Comment does not belong to the user" });

    await Comment.findByIdAndDelete({ _id: commentID });

    return res.status(200).json({ message: "Comment successfully deleted" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createNewPost,
  getPost,
  likePost,
  addComment,
  deleteComment,
  deletePost,
  updatePost,
};
