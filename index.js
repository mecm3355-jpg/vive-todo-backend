const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
  quiet: true,
});

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const Todo = require("./models/todo");
const User = require("./models/user");
const authRouter = require("./routes/authRouter");
const todoRouter = require("./routes/todoRouter");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!MONGODB_URI) {
  console.error("MONGODB_URI가 없습니다. .env 파일을 확인해 주세요.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET이 없습니다. .env 파일을 확인해 주세요.");
  process.exit(1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("허용되지 않은 프론트엔드 주소입니다."));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/todos", todoRouter);

app.get("/", (req, res) => {
  res.send("서버가 정상적으로 실행 중입니다.");
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    await User.init();
    await Todo.init();
    console.log("몽고디비 연결 성공");

    app.listen(PORT, () => {
      console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error("몽고디비 연결 실패:", error.message);
    process.exit(1);
  }
}

startServer();
