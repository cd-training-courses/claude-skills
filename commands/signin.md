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

Check whether it already is:

```bash
claude mcp get msec-mcp
```

- **It reports a server** → registered. Go to step 2.
- **It says there is no such server** → register it now, at **user scope** so the
  courses work in every project rather than only this one:

  ```bash
  claude mcp add -s user --transport http msec-mcp https://msec-mcp-production.fly.dev/mcp
  ```

  Tell the user plainly what you are doing and why — one-off setup, connects them
  to Dave's course content, nothing secret involved.

  **Then they must restart Claude Code**, because MCP servers are only picked up at
  startup. Say so clearly, and tell them to run `/msec:signin` again afterwards.
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

Call the `authenticate` tool for the `msec-mcp` server. (The full tool name depends
on how the server is registered, so match on the server name rather than assuming
a prefix.) It returns a URL.

Do all three of these:

1. **Open the URL in their browser for them** — `open "<url>"` on macOS,
   `xdg-open "<url>"` on Linux, `start "" "<url>"` on Windows. This asks their
   permission to run the command; warn them so it doesn't come as a surprise.
2. **Print the URL as well**, on its own line, so they can paste it themselves if
   the browser doesn't open or opens in the wrong profile.
3. **Tell them what happens next**, briefly:
   - they enter the email address their courses are registered against
   - a **six-digit code** is emailed to them
   - they type that code into **the page already open in their browser** — the
     email contains no link, and the code only works in the browser that started
     the sign-in
   - the code lasts ten minutes and can be used once

Then wait. Don't poll, and never start a second sign-in while one is in progress.

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
with. Don't explain OAuth, don't mention tokens, don't narrate tool calls. A few
sentences per step is plenty.
