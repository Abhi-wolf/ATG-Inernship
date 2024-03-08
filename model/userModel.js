const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "User is required"],
    unique: [true, "Try different username"],
  },
  email: {
    type: String,
    required: [true, "Please add the email address"],
    unique: [true, "Email address already taken"],
    validator: [validator.isEmail, "Enter valid email"],
  },

  password: {
    type: String,
    required: [true, "Password is required"],
  },
});

module.exports = mongoose.model("user", userSchema);
