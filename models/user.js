const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "이름을 입력해 주세요."],
      trim: true,
      minlength: [2, "이름은 2자 이상 입력해 주세요."],
      maxlength: [30, "이름은 30자 이하로 입력해 주세요."],
    },
    email: {
      type: String,
      required: [true, "이메일을 입력해 주세요."],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [254, "이메일이 너무 깁니다."],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "올바른 이메일을 입력해 주세요."],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users",
  },
);

module.exports = mongoose.model("User", userSchema);
