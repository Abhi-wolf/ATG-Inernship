const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
const {
  createNewPost,
  likePost,
  getPost,
  addComment,
  deleteComment,
  deletePost,
  updatePost,
} = require("../controllers/postController");
const upload = require("../middleware/multerMiddleware");

router.use(validateToken);
router.post(
  "/createPost",
  upload.fields([{ name: "images", maxCount: 3 }]),
  createNewPost
);

router.put(
  "/updatePost/:id",
  upload.fields([{ name: "images", maxCount: 3 }]),
  updatePost
);

router.patch("/like/:id", likePost);
router.get("/post/:id", getPost);
router.post("/deletePost/:id", deletePost);
router.post("/addComment/:id", addComment);
router.post("/deleteComment/:postID/:commentID", deleteComment);

module.exports = router;
