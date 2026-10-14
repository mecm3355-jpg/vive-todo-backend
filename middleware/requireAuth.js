const jwt = require("jsonwebtoken");
const User = require("../models/user");

const COOKIE_NAME = "todo_auth";

async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ message: "사용자 정보를 찾을 수 없습니다." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError") {
      console.error("인증 확인 실패:", error.message);
    }

    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ message: "로그인이 만료되었습니다. 다시 로그인해 주세요." });
  }
}

module.exports = { COOKIE_NAME, requireAuth };
