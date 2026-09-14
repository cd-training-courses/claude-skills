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
/plugin marketplace add https://github.com/cd-training-courses/claude-skills.git
/plugin install msec@cd-training
```

> Use the full `https://…​.git` URL form above. (A bare `cd-training-courses/claude-skills`
> can try to clone over SSH and fail if you have no GitHub SSH key configured.)

This install registers the six course commands **and** connects the content
server — no MCP config to hand-edit, and no restart.

## Signing in

**No token to paste, no restart, and no separate sign-in step.** Just start a
course:

```
/msec:atdd-learn
```

Claude notices you aren't signed in and offers to sort it out:

1. Your browser opens on our sign-in page — the link is printed too, in case it
   opens in the wrong place.
2. Enter **the email address your courses are registered against** at CD.Training.
   This is what decides your access, so use the right one; a different address
   quietly gets you the free tier.
3. We email you a **six-digit code**. Type it into **the page already open in your
   browser**. There's no link in the email, the code only works in the browser that
   started the sign-in, and it lasts ten minutes.
4. **Tell Claude you've entered it** — it can't see the sign-in finish from its
   side, so it waits for you to say so.

Then it picks straight up with the course you asked for.

If you'd rather sign in before starting anything, **`/msec:signin`** does the same
thing on its own, and is also how you check your access later or sign in as
someone else.

Your session is stored in your operating system's keychain (macOS Keychain /
Windows Credential Manager / Linux Secret Service), never in a config file and
never in this repo. It **renews itself**, so there's nothing to rotate and no
monthly re-paste.

> **If your browser shows "This site can't be reached" after you type the code**,
> nothing is broken — the sign-in worked and only the hand-back failed. Copy the
> whole address from the browser's address bar and paste it back to Claude, which
> can finish from there.

> **Rarely, Claude may say it needs to connect you to the content server first.**
> Let it — a one-off setup step, after which it'll ask you to restart Claude Code
> and try again. This only happens if the plugin's own registration was blocked,
> usually by another connector on your account using the same address. Normally
> you'll never see it.

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
