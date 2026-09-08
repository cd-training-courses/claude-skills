---
description: Connect and sign in to the MSEC course content server so the course skills can reach your material.
---

You are getting the user connected and signed in to the `msec-mcp` course content
server. Make it feel like one short, guided step — they should not need to know
what an MCP server is, or that `/mcp` exists.

The user's input: $ARGUMENTS

## Step 1 — is the content server even registered?

The plugin ships skills only. The content server is a plain HTTPS service, and it
has to be registered with Claude Code once before any skill can call it.

Check whether it already is. Match the name **exactly**, at the start of a line:

```bash
claude mcp list | grep -E "^(plugin:msec:)?msec-mcp:"
```

> **Do not use `claude mcp get msec-mcp` for this.** When the server is absent that
> command prints "No MCP server named…" *followed by a list of every configured
> server* — and many accounts have a claude.ai connector called
> **`claude.ai msec-mcp`** in that list. Reading the name there and concluding it is
> registered is wrong, and it dead-ends: a connector has its own sign-in which this
> skill cannot drive. It is a different thing that merely shares a name. Ignore it
> entirely, whatever it is called, and go by the `grep` above.

- **A line comes back** → registered. It will usually read `plugin:msec:msec-mcp:`,
  because the plugin declares the server itself; that is the normal case.

  **But check you can actually see its tools before going on.** A server the
  plugin declares loads immediately on install — no restart — so normally they are
  there. One registered by the `claude mcp add` fallback below is different: that
  one does need a restart. So if the server is registered and yet none of its tools
  exist in this session — no `list_catalog`, no `authenticate` — say exactly that,
  tell them to **restart Claude Code and run `/msec:signin` again**, and stop. Do
  not try to authenticate; there is nothing to call, and hunting for a tool that
  cannot exist yet just confuses everyone.
- **No output** → not registered. This happens if the plugin's own declaration was
  suppressed — most often because another connector on the account points at the
  same URL. Register it directly instead, at **user scope** so the courses work in
  every project rather than only this one:

  ```bash
  claude mcp add -s user --transport http msec-mcp https://msec-mcp-production.fly.dev/mcp
  ```

  Tell the user plainly what you are doing and why — one-off setup, connects them
  to Dave's course content, nothing secret involved.

  **Then they must restart Claude Code** — a server registered this way, unlike one
  the plugin declares, is only picked up at startup. Say so clearly, and tell them
  to run `/msec:signin` again afterwards.
  Do not attempt to continue in this session; the server's tools will not exist
  yet. Stop here.

## Step 2 — are they already signed in?

Try a cheap call — `list_catalog(limit=1)`.

- **It succeeds** → they are already signed in. Tell them so and report what they
  can reach, reading `caller_tier` from the envelope: name the courses whose tier
  is `paid`, and say plainly if they are on the free tier everywhere. Then stop.
  Do not start a sign-in they do not need.
- **It fails because the server needs authentication** → step 3.
- **It fails because the server is unreachable** (connection refused, DNS failure,
  a 5xx, a timeout) → this is *not* a sign-in problem. Say the course server can't
  be reached right now and to try again shortly. Do not offer to sign them in;
  that sends them round a loop that cannot succeed.

If they are explicitly asking to sign in as a *different* person, skip this check.

## Step 3 — sign in

Call the `authenticate` tool belonging to the `msec-mcp` server. Depending on how
it got registered its name is either `mcp__plugin_msec_msec-mcp__authenticate`
(the plugin's own declaration — the usual case) or `mcp__msec-mcp__authenticate`
(registered directly).

> **Not `mcp__claude_ai_msec-mcp__authenticate`.** That one belongs to the claude.ai
> connector, and calling it dead-ends: the connector owns its own sign-in, which
> this skill cannot complete. If the only `authenticate` tool you can see is a
> `claude_ai_` one, the local server is not registered — go back to step 1.

It returns a URL.

Do these three things:

1. **Open the URL in their browser for them** — `open "<url>"` on macOS,
   `xdg-open "<url>"` on Linux, `start "" "<url>"` on Windows. This asks their
   permission to run the command; warn them so it doesn't come as a surprise.
2. **Print the URL as well**, on its own line, so they can paste it themselves if
   the browser doesn't open or opens in the wrong profile.
3. **Then say exactly this, and nothing more:**

   > Enter your registered CD.Training email on the page, then check your inbox
   > for a six-digit code and type it into the page that's already open.
   >
   > If the browser shows "This site can't be reached", copy the whole URL from
   > the address bar and paste it here.
   >
   > Let me know once you've entered the code.

Keep it to that. Don't add the ten-minute expiry, don't explain that the email
has no link, and don't explain *why* you need telling — the instruction is enough,
and every extra sentence is one more thing between them and the course.

The last line is load-bearing, so never drop it: you cannot detect the sign-in
completing on your own, and without it you will sit silently while they sit
waiting for you.

Don't poll, and never start a second sign-in while one is in progress.

## If the browser page fails

They may report **"This site can't be reached"** or `ERR_CONNECTION_REFUSED` after
typing the code. The sign-in itself has almost certainly worked — only the
hand-back to Claude Code failed.

Ask them to copy the **entire URL from the browser's address bar** — it looks like
`http://localhost:3118/callback?code=...&state=...` — and paste it to you. Pass it
to the `complete_authentication` tool for the same server. That finishes the job.

This works because *we* started the flow, so Claude Code still holds the key needed
to redeem the code. Reassure them: nothing is broken and nothing is lost.

## When it succeeds

Confirm it in terms they care about — which courses they can now use, from
`caller_tier`, not "a token was issued". Then tell them:

- signing in is a one-off; it renews itself from now on
- a course bought later appears on its own within the hour
- `/msec:signin` again any time checks their access, or signs them in as someone
  else

If they signed in but are on the free tier everywhere they expected paid access,
the likely cause is signing in with a different address from the one their courses
are registered against. Say so, and suggest running `/msec:signin` again with the
right one rather than leaving them puzzled.

## Tone

Brief and calm. This is plumbing between the user and a course they want to get on
with.

**Don't narrate the plumbing.** No "let me load its auth tools", no mention of
OAuth, tokens, MCP servers or tool names — a student doesn't know what those are
and doesn't need to. Say what you're doing in their terms ("getting you signed
in") or say nothing and just do it. A few sentences per step is plenty.
