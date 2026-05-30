const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const STORE_PATH = path.join(DATA_DIR, "sync-store.json");
const MAX_BODY_SIZE = 1024 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

ensureStore();

const server = http.createServer(async function (request, response) {
  try {
    if (request.method === "POST" && request.url === "/api/sync/create") {
      await handleCreate(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/sync/login") {
      await handleLogin(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/sync/load") {
      await handleLoad(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/sync/save") {
      await handleSave(request, response);
      return;
    }

    serveStaticFile(request, response);
  } catch (error) {
    sendJson(response, 500, { error: "サーバーエラーが発生しました" });
  }
});

server.listen(PORT, function () {
  console.log(`Task manager is running at http://localhost:${PORT}/task.html`);
});

async function handleCreate(request, response) {
  const body = await readJsonBody(request);
  const validationError = validateCredentials(body.accountId, body.password);

  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  const store = readStore();

  if (store.accounts[body.accountId]) {
    sendJson(response, 409, { error: "このIDはすでに作成されています。ログインしてください" });
    return;
  }

  store.accounts[body.accountId] = createAccount(body.password, sanitizeSyncData(body.data));
  writeStore(store);
  sendJson(response, 200, { data: store.accounts[body.accountId].data });
}

async function handleLogin(request, response) {
  const body = await readJsonBody(request);
  const validationError = validateCredentials(body.accountId, body.password);

  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  const store = readStore();
  const account = store.accounts[body.accountId];

  if (!account || !verifyPassword(body.password, account)) {
    sendJson(response, 401, { error: "IDまたはパスワードが違います" });
    return;
  }

  sendJson(response, 200, { data: sanitizeSyncData(account.data) });
}

async function handleLoad(request, response) {
  const body = await readJsonBody(request);
  const validationError = validateCredentials(body.accountId, body.password);

  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  const store = readStore();
  const account = store.accounts[body.accountId];

  if (!account) {
    store.accounts[body.accountId] = createAccount(body.password, sanitizeSyncData(body.clientData));
    writeStore(store);
    sendJson(response, 200, { data: store.accounts[body.accountId].data });
    return;
  }

  if (!verifyPassword(body.password, account)) {
    sendJson(response, 401, { error: "IDまたはパスワードが違います" });
    return;
  }

  sendJson(response, 200, { data: sanitizeSyncData(account.data) });
}

async function handleSave(request, response) {
  const body = await readJsonBody(request);
  const validationError = validateCredentials(body.accountId, body.password);

  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  const store = readStore();
  const account = store.accounts[body.accountId];

  if (!account || !verifyPassword(body.password, account)) {
    sendJson(response, 401, { error: "IDまたはパスワードが違います" });
    return;
  }

  account.data = sanitizeSyncData(body.data);
  account.updatedAt = new Date().toISOString();
  writeStore(store);
  sendJson(response, 200, { ok: true, updatedAt: account.updatedAt });
}

function createAccount(password, data) {
  const salt = crypto.randomBytes(16).toString("hex");

  return {
    salt: salt,
    passwordHash: hashPassword(password, salt),
    data: data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
}

function verifyPassword(password, account) {
  const actualHash = hashPassword(password, account.salt);
  const expected = Buffer.from(account.passwordHash, "hex");
  const actual = Buffer.from(actualHash, "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function validateCredentials(accountId, password) {
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(accountId || "")) {
    return "IDは3〜40文字の英数字・_・-で入力してください";
  }

  if (typeof password !== "string" || password.length < 12) {
    return "パスワードは12桁以上にしてください";
  }

  return "";
}

function sanitizeSyncData(data) {
  return {
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    priorities: Array.isArray(data?.priorities) ? data.priorities : []
  };
}

function serveStaticFile(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = requestUrl.pathname === "/" ? "/task.html" : requestUrl.pathname;
  const safePath = path
    .normalize(decodeURIComponent(requestedPath))
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
  });
  fs.createReadStream(filePath).on("error", function () {
    response.end();
  }).pipe(response);
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";

    request.on("data", function (chunk) {
      body += chunk;

      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("Request body is too large"));
      }
    });

    request.on("end", function () {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(STORE_PATH)) {
    writeStore({ accounts: {} });
  }
}

function readStore() {
  try {
    const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));

    return store && store.accounts ? store : { accounts: {} };
  } catch (error) {
    return { accounts: {} };
  }
}

function writeStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}
