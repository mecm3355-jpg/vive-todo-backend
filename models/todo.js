const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "할 일 내용을 입력해 주세요."],
      trim: true,
      maxlength: [200, "할 일은 200자 이하로 입력해 주세요."],
    },
    deadline: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: {
        values: ["high", "medium", "low"],
        message: "올바른 우선순위를 선택해 주세요.",
      },
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "todos",
  },
);

todoSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("Todo", todoSchema);
