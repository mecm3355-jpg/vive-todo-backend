const assert = require("assert/strict");

const baseUrl = process.env.TEST_API_URL || "http://localhost:5000";
const password = "Test-password-1234";
const email = `auth-test-${Date.now()}@example.com`;
let cookie = "";

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";", 1)[0];
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function run() {
  let accountCreated = false;

  try {
    const signup = await api("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "인증 테스트",
        email,
        password,
      }),
    });
    assert.equal(signup.response.status, 201);
    assert.equal(signup.data.user.email, email);
    assert.match(cookie, /^todo_auth=/);
    accountCreated = true;

    const me = await api("/auth/me");
    assert.equal(me.response.status, 200);
    assert.equal(me.data.user.email, email);

    const created = await api("/todos", {
      method: "POST",
      body: JSON.stringify({ content: "인증 통합 테스트", priority: "high" }),
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.data.content, "인증 통합 테스트");

    const list = await api("/todos");
    assert.equal(list.response.status, 200);
    assert.equal(list.data.length, 1);
    assert.equal(list.data[0]._id, created.data._id);

    const updated = await api(`/todos/${created.data._id}`, {
      method: "PUT",
      body: JSON.stringify({
        content: "수정된 인증 통합 테스트",
        priority: "medium",
        completed: true,
      }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.completed, true);

    const deleted = await api(`/todos/${created.data._id}`, { method: "DELETE" });
    assert.equal(deleted.response.status, 200);

    const withdrawal = await api("/auth/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    assert.equal(withdrawal.response.status, 200);
    accountCreated = false;

    const unauthorized = await api("/todos");
    assert.equal(unauthorized.response.status, 401);

    console.log("회원가입, 인증, Todo CRUD, 회원탈퇴 통합 테스트 통과");
  } finally {
    if (accountCreated) {
      await api("/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      }).catch(() => {});
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
