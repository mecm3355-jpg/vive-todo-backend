const express = require("express");
const Todo = require("../models/todo");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find({ owner: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json(todos);
  } catch (error) {
    console.error("할 일 목록 조회 실패:", error.message);
    return res
      .status(500)
      .json({ message: "할 일 목록을 불러오지 못했습니다." });
  }
});

router.post("/", async (req, res) => {
  try {
    const todo = await Todo.create({
      owner: req.user._id,
      content: req.body.content,
      deadline: req.body.deadline || null,
      priority: req.body.priority || null,
      completed: false,
    });

    res.status(201).json(todo);
  } catch (error) {
    if (error.name === "ValidationError") {
      const message =
        error.errors?.content?.message ||
        error.errors?.priority?.message ||
        "입력한 내용을 확인해 주세요.";

      return res.status(400).json({ message });
    }

    if (error.name === "CastError" && error.path === "deadline") {
      return res.status(400).json({ message: "올바른 마감기한이 아닙니다." });
    }

    console.error("할 일 생성 실패:", error.message);
    return res.status(500).json({ message: "할 일을 저장하지 못했습니다." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        content: req.body.content,
        deadline: req.body.deadline || null,
        priority: req.body.priority || null,
        completed: Boolean(req.body.completed),
      },
      { returnDocument: "after", runValidators: true },
    );

    if (!todo) {
      return res.status(404).json({ message: "할 일을 찾을 수 없습니다." });
    }

    return res.status(200).json(todo);
  } catch (error) {
    if (error.name === "ValidationError") {
      const message =
        error.errors?.content?.message ||
        error.errors?.priority?.message ||
        "입력한 내용을 확인해 주세요.";

      return res.status(400).json({ message });
    }

    if (error.name === "CastError") {
      if (error.path === "deadline") {
        return res.status(400).json({ message: "올바른 마감기한이 아닙니다." });
      }

      return res.status(400).json({ message: "올바른 할 일 ID가 아닙니다." });
    }

    console.error("할 일 수정 실패:", error.message);
    return res.status(500).json({ message: "할 일을 수정하지 못했습니다." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!todo) {
      return res.status(404).json({ message: "할 일을 찾을 수 없습니다." });
    }

    return res.status(200).json(todo);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "올바른 할 일 ID가 아닙니다." });
    }

    console.error("할 일 삭제 실패:", error.message);
    return res.status(500).json({ message: "할 일을 삭제하지 못했습니다." });
  }
});

module.exports = router;
