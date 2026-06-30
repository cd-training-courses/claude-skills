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

This single install registers all six course commands **and** auto-registers the
`msec-mcp` content server — there is no MCP config to hand-edit.

## Access tiers

The courses run on a **free tier out of the box** — install and start using
`/msec:atdd-learn` immediately, no token, no setup. Free tier teaches from lesson
summaries; paid tier unlocks full lesson bodies. Tiers are **per course**.

If you registered with CD.Training, you'll receive a **token by email**. When the
plugin is enabled, Claude Code **prompts you for it**:

> **MSEC course token** — *Paste the token from your CD.Training registration
> email for full (paid) course access. Leave blank for the free tier.*

Paste your token to unlock paid access, or **leave it blank for the free tier**.
Your token is stored **securely in your operating system's keychain** (macOS
Keychain / Windows Credential Manager / Linux Secret Service) — never in a config
file and never in this repo.

### Updating or rotating your token

Tokens are valid for 30 days. To enter a new one:

> `/plugin` → **Installed** → **MSEC Courses** → **Configure options** →
> **MSEC course token** → paste the new token → **Save configuration**

Then run `/mcp` (or restart Claude Code) to reconnect with the new token.

> **Note:** the Configure dialog can *replace* your token but can't *clear* it back
> to empty (leaving the field blank keeps the existing value). If you ever need to
> drop back to the free tier, uninstall and reinstall the plugin and leave the
> prompt blank.

## Verify it's working

After installing, run `/msec:atdd-learn` and pick a topic. Claude will fetch the
lesson from the content server and start coaching. If you see your tier announced
(free or paid) and real lesson content, you're set.
