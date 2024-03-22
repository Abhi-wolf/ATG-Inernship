const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");

// for authentication using localStorage
// const validateToken = require("../middleware/validateTokenHandler");

// for authentication using cookies
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword", resetPassword);
router.get("/current", isAuthenticated, currentUser);

module.exports = router;
