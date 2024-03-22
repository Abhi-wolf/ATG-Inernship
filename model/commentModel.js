const mongoose = require("mongoose");
const EncryptField = require("../utils/Encryption");

const commentSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Please add the comment"],
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    postId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Post",
    },
  },
  {
    timestamps: true,
  }
);

// commentSchema.pre("save", function (next) {
//   this.content = EncryptField(this.content, process.env.ENCRYPTION_KEY);
//   next();
// });

module.exports = mongoose.model("Comment", commentSchema);
