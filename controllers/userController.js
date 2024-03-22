const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../model/userModel");
const nodemailer = require("nodemailer");
const ResetToken = require("../model/ResetToken");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // required for TLS
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD, // app password generated from email settings
  },
});

/* VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500, */

// @desc Register a user
// @route GET /api/users/register
// @access public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check for userName or password or email if not given throw error
    if (!username || !password || !email) {
      res.status(400);
      throw new Error("All fields are mandatory");
    }

    // check is user exist with the given email
    const userAvailable = await User.findOne({ email });
    const userAvailableWithGivenUsername = await User.findOne({ username });
    if (userAvailable || userAvailableWithGivenUsername) {
      res.status(400);
      throw new Error(
        "User already registered with the given email or given username"
      );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // if user successfully created then send the confirmation mail
    if (user) {
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Registration successful message",
        html: `<h3>Congratulation's your registration is successful. Your userId is ${username}`,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        res.status(201).json({ id: user.id, email: user.email });
      } catch (err) {
        console.log(err.message);
      }
    } else {
      res.status(400);
      return res.status(400).json({ message: "User data not valid" });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ message: err.message });
  }
};

// @desc Login  user
// @route GET /api/users/login
// @access public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // check for email and password is present or not, if not present throw new error
    if (!username || !password) {
      res.status(400);
      throw new Error("All fields are mandatory");
    }

    // find user with the email id
    const user = await User.findOne({ username });

    // compare password with hashed password and generate the jwt token and send in the response
    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign(
        {
          user: {
            userName: user.userName,
            email: user.email,
            id: user.id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10000m" }
      );

      res.status(200).json({
        accessToken,
        id: user._id,
      });
    } else {
      res.status(401);
      throw new Error("username or password is not valid");
    }
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ message: err.message });
  }
};

// @desc Current user info
// @route GET /api/users/current
// @access private
const currentUser = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ message: err.message });
  }
};

// @desc Forgot password
// @route GET /api/users/forgotPassword
// @access private
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // find the user from database using email
    const user = await User.findOne({ email });

    // if user not found return user not found error
    if (!user) {
      res.status(401).json({ message: "User not found" });
    }

    // generate a token to be sent along with the email
    const forgetPasswordToken = crypto.randomBytes(20).toString("hex");

    // store the forgetPasswordToken in the database
    const resetToken = new ResetToken({
      user: user._id,
      token: forgetPasswordToken,
    });
    await resetToken.save();

    // send email to user with password reset link along with forgetPasswordToken and id
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset your password",
      html: `http://127.0.0.1:5001/api/users/resetPassword?token=${forgetPasswordToken}&id=${user._id}`,
    };

    transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Check your email to reset password" });
  } catch (err) {
    console.log(err.message);
  }
};

// @desc Reset password
// @route GET /api/users/resetPassword
// @access private
const resetPassword = async (req, res) => {
  const { token, id } = req.query;
  const { password } = req.body;

  try {
    // return error if token or id is not present in req
    if (!token || !id) {
      return res.status(400).json({ message: "Invalid Id" });
    }

    // find user
    const user = await User.findOne({ _id: id });

    // return error if user not present
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // get reset token from the database for the user
    const resetToken = await ResetToken.findOne({ user: user._id });

    // return error if reset token not found
    if (!resetToken) {
      return res.status(400).json({ message: "Reset token not found" });
    }

    // match both the tokens , token from the req and the token from the database
    const isMatch = await bcrypt.compareSync(token, resetToken.token);

    // return error if token does not matches
    if (!isMatch) {
      return res.status(400).json({ message: "Token is not valid" });
    }

    // encrypt the new password and update the user's password in the database
    const newPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(user._id, {
      password: newPassword,
    });

    // remove reset token from the database after successfully changing password
    await ResetToken.deleteOne({ user: user._id });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.log(err.message, "hello");
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  forgotPassword,
  resetPassword,
};
