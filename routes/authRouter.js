const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Todo = require("../models/todo");
const User = require("../models/user");
const { COOKIE_NAME, requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

function setAuthCookie(res, userId) {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: "7d",
  });

  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "비밀번호는 8자 이상 입력해 주세요.";
  }

  if (password.length > 72) {
    return "비밀번호는 72자 이하로 입력해 주세요.";
  }

  return null;
}

router.post("/signup", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = req.body.password;
    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    setAuthCookie(res, user._id);

    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({ message: firstError?.message || "입력한 내용을 확인해 주세요." });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    console.error("회원가입 실패:", error.message);
    return res.status(500).json({ message: "회원가입을 처리하지 못했습니다." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = req.body.password;
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || typeof password !== "string") {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    setAuthCookie(res, user._id);
    return res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    console.error("로그인 실패:", error.message);
    return res.status(500).json({ message: "로그인을 처리하지 못했습니다." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  return res.status(200).json({ message: "로그아웃되었습니다." });
});

router.get("/me", requireAuth, (req, res) => {
  return res.status(200).json({ user: publicUser(req.user) });
});

router.delete("/me", requireAuth, async (req, res) => {
  try {
    const password = req.body.password;
    const user = await User.findById(req.user._id).select("+passwordHash");

    if (!user || typeof password !== "string") {
      return res.status(400).json({ message: "비밀번호를 입력해 주세요." });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });
    }

    await Todo.deleteMany({ owner: user._id });
    await User.findByIdAndDelete(user._id);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });

    return res.status(200).json({ message: "회원탈퇴가 완료되었습니다." });
  } catch (error) {
    console.error("회원탈퇴 실패:", error.message);
    return res.status(500).json({ message: "회원탈퇴를 처리하지 못했습니다." });
  }
});

module.exports = router;
