# MSEC Courses

Dave Farley's software engineering courses, delivered as Claude Code skills that
coach, build, and review **live from the course material** — in your own codebase
and your own stack.

Two courses are available today:

- **ATDD** — Acceptance Test Driven Development (`/msec:atdd-learn`, `/msec:atdd-build`, `/msec:atdd-review`)
- **CD Pipelines** — Continuous Delivery & deployment pipelines (`/msec:pipelines-learn`, `/msec:pipelines-build`, `/msec:pipelines-review`)

Each course has three modes:

| Mode | What it does |
|------|--------------|
| `…-learn` | Interactive, Socratic coaching on the concepts, taught from the lessons. |
| `…-build` | Hands-on help building the real artifact in your project, the right way. |
| `…-review` | Reviews your existing work against Dave's principles. |

## Install

From inside a running Claude Code session:

```text
/plugin marketplace add https://github.com/mse-online/msec-courses.git
/plugin install msec@msec-courses
```

> Use the full `https://…​.git` URL form above. (A bare `mse-online/msec-courses`
> can try to clone over SSH and fail if you have no GitHub SSH key configured.)

This install registers the six course commands. Connecting to the content server
is a separate one-off step — `/msec:signin` does it for you below, so there is
still no MCP config to hand-edit.

## Signing in

**There is no token to request or paste.** After installing, **restart Claude
Code**, then run:

```
/msec:signin
```

Claude signs you in:

1. Your browser opens on our sign-in page (the link is printed too, in case it
   opens in the wrong place).
2. Enter **the email address your courses are registered against** at CD.Training.
   This is what decides your access, so use the right one — a different address
   quietly gets you the free tier.
3. We email you a **six-digit code**. Type it into **the page already open in your
   browser**. There is no link in the email, and the code only works in the browser
   that started the sign-in. It lasts ten minutes.

That's it. Your session is stored in your operating system's keychain (macOS
Keychain / Windows Credential Manager / Linux Secret Service), never in a config
file and never in this repo. It **renews itself**, so there is nothing to rotate
and no monthly re-paste.

You can skip `/msec:signin` if you like — the course skills notice when you aren't
connected or signed in, and offer to sort it out there and then.

> **If Claude says it needs to connect you to the content server first**, let it.
> That's a one-off setup step, and it'll ask you to restart Claude Code and run
> `/msec:signin` again. It only happens if the plugin's own registration was
> blocked, usually by another connector on your account using the same address.

> **If your browser shows "This site can't be reached" after you type the code**,
> nothing is broken — the sign-in worked and only the hand-back failed. Copy the
> whole address from the browser's address bar and paste it back to Claude, which
> can finish from there.

## Access tiers

Tiers are **per course**, and decided by the email address you sign in with:

- **No entitlements → free tier.** Lesson summaries plus a polite upgrade hint.
- **Entitled → paid tier.** Full lesson bodies as Dave wrote them.

Note that signing in is required either way — the free tier is a signed-in session
carrying no courses, not the absence of a sign-in.

If you buy another course later it appears on its own within the hour; there is
nothing to re-enter.

## Verify it's working

After installing, run `/msec:atdd-learn` and pick a topic. Claude will fetch the
lesson from the content server and start coaching. If you see your tier announced
(free or paid) and real lesson content, you're set.
