#!/usr/bin/env node
// Local stdio MCP proxy for msec-mcp that performs OAuth (register -> authorize -> token) itself.
// Requires Node 18+. No dependencies. Usage: node msec-mcp-wrapper.mjs [--login] [--logout]
//
// Purpose for server maintainers: VS Code was observed prompting for a manual "Client ID" and then
// sending that text (an email address) as client_id to /authorize, instead of an id issued by /register.
// This script does the standard flow by hand, so the stderr log shows what each endpoint returns.
// Flow: discovery -> POST /register -> GET /authorize (browser, PKCE) -> loopback redirect -> POST /token.
//
// To reproduce: `node msec-mcp-wrapper.mjs --login` and read stderr. Each step logs "<step>: <METHOD> <url> -> <status>"
// and, on failure, the first 500 chars of the body. This script is NOT VS Code, so a clean run here
// means the server's flow works and the fault is in what VS Code is given (see checklist), not in
// the endpoints themselves.
//
// Server-side checklist (things VS Code's MCP client relies on; none verified from the server code):
//  1. 401 from POST /mcp should carry `WWW-Authenticate: Bearer resource_metadata="<url>"` and that URL
//     (/.well-known/oauth-protected-resource, RFC 9728) should return JSON; today it returns 404.
//     Without it the client may skip discovery and fall back to asking the user for a client id.
//  2. The authorization-server metadata lists token_endpoint_auth_methods_supported as only
//     client_secret_post / client_secret_basic. A public PKCE client needs `none` advertised and accepted.
//  3. POST /register must return 201 with a `client_id`, accept http://127.0.0.1:<random port>/ and
//     https://vscode.dev/redirect as redirect_uris, and accept `token_endpoint_auth_method: none`.
//  4. The issued client_id must survive restarts and multiple Fly machines (shared storage), because
//     /authorize, /token and refresh all look it up later.
//  5. /authorize and /token receive the RFC 8707 `resource` parameter; they should accept it.
//  6. /authorize currently accepted an email address as client_id; it should reject unregistered ids,
//     which makes this failure mode visible early instead of surfacing at /token.
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";

const BASE = (process.env.MSEC_BASE_URL ?? "https://msec-mcp-production.fly.dev").replace(/\/$/, "");
const MCP_URL = `${BASE}/mcp`;
const STORE_DIR = path.join(os.homedir(), ".msec-mcp-wrapper");
const STORE = path.join(STORE_DIR, "state.json");

// stdout is the MCP channel, so every diagnostic goes to stderr.
const log = (...a) => console.error("[msec-wrapper]", ...a);

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STORE, "utf8"));
  } catch {
    return {};
  }
}

function saveState(s) {
  fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(STORE, JSON.stringify(s, null, 2), { mode: 0o600 });
}

let state = loadState();

// Every HTTP call goes through here so status and error bodies show up in the log.
async function logged(label, url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  log(`${label}: ${init?.method ?? "GET"} ${url} -> ${res.status}`);
  if (!res.ok) log(`${label}: body: ${text.slice(0, 500)}`);
  return { res, text };
}

// Step 1: RFC 8414 metadata. Note /.well-known/oauth-protected-resource (RFC 9728) returns 404 on the server.
async function discover() {
  const { res, text } = await logged("discovery", `${BASE}/.well-known/oauth-authorization-server`);
  if (!res.ok) throw new Error("authorization server metadata not available");
  return JSON.parse(text);
}

// Random-port 127.0.0.1 listener, as VS Code uses; /register must accept such redirect_uris (RFC 8252).
function startLoopback() {
  return new Promise((resolve, reject) => {
    let settle;
    const result = new Promise((r) => (settle = r));
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, "http://127.0.0.1");
      res.setHeader("Content-Type", "text/plain");
      if (!u.searchParams.has("code") && !u.searchParams.has("error")) {
        res.statusCode = 404;
        res.end("not found");
        return;
      }
      res.end("Signed in. You can close this tab and return to your editor.");
      settle({ code: u.searchParams.get("code"), state: u.searchParams.get("state"), error: u.searchParams.get("error") });
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, result }));
  });
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === "win32" ? ["cmd", ["/c", "start", '""', url.replace(/&/g, "^&")]]
    : process.platform === "darwin" ? ["open", [url]]
    : ["xdg-open", [url]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch {
    // The URL is also logged, so a failed launch is recoverable.
  }
}

const b64u = (buf) => buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

async function tokenRequest(meta, params) {
  const { res, text } = await logged("token", meta.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new Error(`token endpoint returned ${res.status}`);
  const t = JSON.parse(text);
  state.tokens = { ...t, expires_at: Date.now() + (t.expires_in ?? 3600) * 1000 };
  saveState(state);
}

async function interactiveLogin() {
  const meta = await discover();
  const loop = await startLoopback();
  const redirect = `http://127.0.0.1:${loop.port}/`;
  try {
    // Step 2: dynamic client registration; a public client, so no secret is requested.
    // Item 2 in the header checklist: "none" is not in the advertised token_endpoint_auth_methods_supported.
    const body = {
      client_name: "msec-mcp-wrapper",
      redirect_uris: [redirect],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };
    const { res, text } = await logged("register", meta.registration_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`register returned ${res.status}`);
    const reg = JSON.parse(text);
    if (!reg.client_id) throw new Error("register response has no client_id");
    log(`register: client_id=${reg.client_id}`);

    // Step 3: /authorize must receive exactly this client_id; compare with what VS Code sends.

    const verifier = b64u(crypto.randomBytes(32));
    const challenge = b64u(crypto.createHash("sha256").update(verifier).digest());
    const st = b64u(crypto.randomBytes(16));
    const authUrl = new URL(meta.authorization_endpoint);
    authUrl.search = new URLSearchParams({
      client_id: reg.client_id,
      response_type: "code",
      code_challenge: challenge,
      code_challenge_method: "S256",
      resource: MCP_URL,
      redirect_uri: redirect,
      state: st,
    }).toString();
    log(`authorize: open this URL if the browser does not: ${authUrl}`);
    openBrowser(authUrl.toString());

    const cb = await Promise.race([
      loop.result,
      new Promise((_, rej) => setTimeout(() => rej(new Error("timed out waiting for sign-in")), 10 * 60 * 1000)),
    ]);
    if (cb.error) throw new Error(`authorize returned error: ${cb.error}`);
    if (cb.state !== st) throw new Error("state mismatch on redirect");
    log("authorize: received code");

    // Step 4: the server must still recognise client_id here, so registrations need persistent storage.
    state.client_id = reg.client_id;
    await tokenRequest(meta, {
      grant_type: "authorization_code",
      code: cb.code,
      client_id: reg.client_id,
      redirect_uri: redirect,
      code_verifier: verifier,
      resource: MCP_URL,
    });
  } finally {
    loop.server.close();
  }
}

// Reuses the registered client_id, so the server must keep it across restarts for refresh to work.
async function refresh() {
  if (!state.tokens?.refresh_token || !state.client_id) return false;
  try {
    const meta = await discover();
    await tokenRequest(meta, {
      grant_type: "refresh_token",
      refresh_token: state.tokens.refresh_token,
      client_id: state.client_id,
      resource: MCP_URL,
    });
    return true;
  } catch (e) {
    log(`refresh failed: ${e.message}`);
    return false;
  }
}

// Shared promise so concurrent requests trigger at most one sign-in.
let authInFlight = null;
function ensureToken(force = false) {
  if (!force && state.tokens && state.tokens.expires_at - 60_000 > Date.now()) return Promise.resolve();
  authInFlight ??= (async () => {
    if (!(await refresh())) await interactiveLogin();
  })().finally(() => (authInFlight = null));
  return authInFlight;
}

let sessionId = null;

// /mcp may answer with plain JSON or an SSE stream; normalise both to a list of messages.
function parseBody(contentType, text) {
  if (!text.trim()) return [];
  if (contentType.includes("text/event-stream")) {
    return text
      .split(/\r?\n\r?\n/)
      .map((ev) => ev.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n"))
      .filter(Boolean)
      .map((d) => JSON.parse(d));
  }
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

// Relays one JSON-RPC message from the editor to the remote server and prints the replies to stdout.
async function forward(line) {
  const msg = JSON.parse(line);
  await ensureToken();
  for (let attempt = 0; attempt < 2; attempt++) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${state.tokens.access_token}`,
    };
    if (sessionId) headers["Mcp-Session-Id"] = sessionId;
    const res = await fetch(MCP_URL, { method: "POST", headers, body: line });
    if (res.status === 401 && attempt === 0) {
      log("mcp: 401, refreshing token");
      await ensureToken(true);
      continue;
    }
    sessionId = res.headers.get("mcp-session-id") ?? sessionId;
    const text = await res.text();
    if (!res.ok) {
      log(`mcp: ${res.status}: ${text.slice(0, 500)}`);
      if (msg.id !== undefined) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: `msec-mcp returned HTTP ${res.status}` } }) + "\n");
      }
      return;
    }
    for (const out of parseBody(res.headers.get("content-type") ?? "", text)) {
      process.stdout.write(JSON.stringify(out) + "\n");
    }
    return;
  }
}

async function main() {
  const arg = process.argv[2];
  if (arg === "--logout") {
    fs.rmSync(STORE, { force: true });
    log("stored state removed");
    return;
  }
  if (arg === "--login") {
    await interactiveLogin();
    log("signed in");
    return;
  }
  const rl = readline.createInterface({ input: process.stdin });
  const pending = new Set();
  rl.on("line", (line) => {
    if (!line.trim()) return;
    const p = forward(line)
      .catch((e) => log(`forward failed: ${e.message}`))
      .finally(() => pending.delete(p));
    pending.add(p);
  });
  rl.on("close", async () => {
    await Promise.all(pending);
    process.exit(0);
  });
}

main().catch((e) => {
  log(e.message);
  process.exit(1);
});
