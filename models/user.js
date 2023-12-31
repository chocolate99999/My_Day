const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    maxLength: 1024
  },
  createdAt: {
    type: Date,
    default: Date.now  // 取得當下時間戳記
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;