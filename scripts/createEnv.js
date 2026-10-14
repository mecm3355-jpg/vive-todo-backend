const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  console.log("기존 .env 파일을 유지했습니다.");
  process.exit(0);
}

const secret = crypto.randomBytes(48).toString("hex");
const contents = [
  "MONGODB_URI=mongodb://127.0.0.1:27017/day4",
  `JWT_SECRET=${secret}`,
  "FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173",
  "",
].join("\n");

fs.writeFileSync(envPath, contents, { encoding: "utf8", flag: "wx", mode: 0o600 });
console.log("안전한 JWT 비밀키가 포함된 .env 파일을 생성했습니다.");
