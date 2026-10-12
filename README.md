# Dave Farley's ATDD course, inside Claude Code and GitHub Copilot

Coaching, hands-on help and review drawn from
[CD.Training](https://courses.cd.training)'s Acceptance Test Driven Development
course — taught live from the course material, in your own codebase and your own
stack. Works in Claude Code, VS Code with GitHub Copilot, and the Copilot CLI.

**You can try it without buying anything.** Sign in with any email address and the
free tier coaches you from the lesson summaries. Buy the ATDD course and the same
commands teach from Dave's full lessons.

The commands are `atdd-learn`, `atdd-build` and `atdd-review` — `/msec:atdd-learn`
in Claude Code, `/atdd-learn` in VS Code — the full course if you've bought it, the
free tier if you haven't. There are three modes:

| Mode | What it does |
|------|--------------|
| `…-learn` | Interactive, Socratic coaching on the concepts, taught from the lessons. |
| `…-build` | Hands-on help building the real artifact in your project, the right way. |
| `…-review` | Reviews your existing work against Dave's principles. |

Your assistant brings these in on its own when your work calls for them. If
another tool answers instead, start one directly with its command, such as
`/msec:atdd-build` or `/atdd-build`.

## Before you start

You'll need one of:

- [Claude Code](https://claude.com/claude-code) installed and signed in to your
  Anthropic account, or
- [VS Code](https://code.visualstudio.com) with the GitHub Copilot extension, or
  the [Copilot CLI](https://docs.github.com/copilot/concepts/agents/about-copilot-cli),
  signed in to a GitHub account with Copilot.

If you haven't used one of these before, installing takes a couple of minutes.

### On Windows with Claude Code, two extra things

**You need Git installed.** The plugin installs by cloning a repository, so without
it the first command fails with `Command 'git' not found`. Get it from
[git-scm.com](https://git-scm.com/download/win), or run
`winget install --id Git.Git -e --source winget`.

**Claude Code may not be on your PATH.** Its Windows installer can finish with
"successfully installed" while `claude` is still not a recognised command — it
tells you so in its own setup notes, which are easy to miss. Fix it in PowerShell,
then open a new terminal:

```powershell
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path","User") + ";$env:USERPROFILE\.local\bin", "User")
```

Both apply to Claude Code itself rather than to these skills, but they land in the
first minute, so they are worth knowing before you start.

## Install — Claude Code

From inside a running Claude Code session:

```text
/plugin marketplace add https://github.com/cd-training-courses/claude-skills.git
/plugin install msec@cd-training
```

> Use the full `https://…​.git` URL form above. (A bare `cd-training-courses/claude-skills`
> can try to clone over SSH and fail if you have no GitHub SSH key configured.)

This install registers the course commands **and** connects the content
server — no MCP config to hand-edit, and no restart.

## Install — GitHub Copilot

Two one-off steps: connect the content server, then put the skills where Copilot
looks for them. Both are user-wide, so the courses work in every project.

### 1. Connect the content server

**VS Code** — click
[Install in VS Code](https://vscode.dev/redirect/mcp/install?name=msec-mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmsec-mcp-production.fly.dev%2Fmcp%22%7D)
and confirm. Or do it by hand: open the Command Palette, run **MCP: Add Server**,
choose **HTTP**, enter `https://msec-mcp-production.fly.dev/mcp`, name it
`msec-mcp`, and pick **Global** so it is available everywhere. (If you'd rather
edit the file, **MCP: Open User Configuration** opens it; the entry is the same as
in this repository's [.vscode/mcp.json](.vscode/mcp.json).)

**Copilot CLI** — add this to `~/.copilot/mcp-config.json` (create the file if it
doesn't exist), then restart the CLI:

```json
{
  "mcpServers": {
    "msec-mcp": {
      "type": "http",
      "url": "https://msec-mcp-production.fly.dev/mcp"
    }
  }
}
```

#### Workaround: VS Code asks for a Client ID (unofficial)

> This section is not part of the upstream project. This is a fork of
> [cd-training-courses/claude-skills](https://github.com/cd-training-courses/claude-skills);
> the wrapper is a diagnostic aid and stopgap for an issue seen in VS Code, not a supported feature.

On some VS Code setups, adding `msec-mcp` ends with VS Code asking you to type a
"Client ID" instead of registering itself, and the `/authorize` request then
carries whatever was typed (for example an email address) rather than an opaque
`client_id` issued by `/register`. The server advertises dynamic client
registration, so VS Code should not need to ask.

[tools/msec-mcp-wrapper/msec-mcp-wrapper.mjs](tools/msec-mcp-wrapper/msec-mcp-wrapper.mjs)
is a dependency-free Node 18+ script that runs the same flow itself
(discovery, `POST /register`, PKCE `/authorize` with a loopback redirect,
`/token`, refresh) and proxies MCP over stdio. Each step and HTTP status is
logged to stderr, which shows where the flow breaks.

```jsonc
// .vscode/mcp.json, or MCP: Open User Configuration
{
  "servers": {
    "msec-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["C:/path/to/claude-skills/tools/msec-mcp-wrapper/msec-mcp-wrapper.mjs"]
    }
  }
}
```

- `node msec-mcp-wrapper.mjs --login` signs in from a terminal and prints each step.
- `node msec-mcp-wrapper.mjs --logout` deletes the stored session.
- The session is kept in `~/.msec-mcp-wrapper/state.json` (owner-only permissions where the OS supports it).
- Set `MSEC_BASE_URL` to point it at a different server.
- Remove any `msec-mcp` HTTP entry first, so the two do not conflict.

The wrapper is untested against the production server's `/register` and `/token`
bodies, so treat any failure it logs as evidence about the server, not a bug to hide.

### 2. Install the skills

Copy the four folders under [skills/](skills/) into `~/.copilot/skills/` — on
Windows, `%USERPROFILE%\.copilot\skills\`. Both VS Code and the Copilot CLI read
that folder, so one copy serves both:

```bash
git clone https://github.com/cd-training-courses/claude-skills.git
mkdir -p ~/.copilot/skills
cp -r claude-skills/skills/* ~/.copilot/skills/
```

```powershell
git clone https://github.com/cd-training-courses/claude-skills.git
New-Item -ItemType Directory -Force "$env:USERPROFILE\.copilot\skills" | Out-Null
Copy-Item -Recurse claude-skills\skills\* "$env:USERPROFILE\.copilot\skills\"
```

> Prefer to track updates with `git pull`? In VS Code, keep the clone wherever you
> like and add its `skills` folder to the `chat.agentSkillsLocations` setting
> instead of copying.

**Optional, VS Code only** — to get `/atdd-learn`, `/atdd-build`, `/atdd-review`
and `/msec-signin` as explicit slash commands, copy the files in
[.github/prompts/](.github/prompts/) into your user prompts folder (**Chat: New
Prompt File** → *User Data Folder* opens it). Without them the skills still load
automatically whenever you ask about acceptance testing; the commands just let you
start one by name.

**Copilot coding agent (GitHub.com)** — the cloud agent has no user profile, so
this is per repository: copy `skills/*` to the target repo's `.github/skills/`,
optionally the prompt files to `.github/prompts/`, and add the `msec-mcp` HTTP
server in that repository's Copilot settings.

## Signing in

Just start a course:

```
/msec:atdd-learn      (Claude Code)
/atdd-learn           (VS Code)
```

Your assistant notices you aren't signed in and offers to sort it out:

1. Your browser opens on our sign-in page — the link is printed too, in case it
   opens in the wrong place (in VS Code, just click it).
2. **Enter your email address.** If you've bought the ATDD course at CD.Training,
   use the address it's registered against — that's what unlocks your material.
   Any other address works too, and gives you the free tier.
3. We email you a **six-digit code**. Type it into **the page already open in your
   browser**. There's no link in the email, the code only works in the browser that
   started the sign-in, and it lasts ten minutes.
4. **Tell your assistant you've entered it** — it can't see the sign-in finish from
   its side, so it waits for you to say so.

Then it picks straight up with the course you asked for.

If you'd rather sign in before starting anything, **`/msec:signin`** (Claude Code)
or **`/msec-signin`** (VS Code) does the same thing on its own, and is also how you
check your access later or sign in as someone else.

Your host handles your session, not this plugin — Claude Code on macOS in the
system Keychain and on Windows in a file in your user profile; VS Code in its own
secret storage. Either way it sits outside your project and outside this
repository. It **renews itself**, so there's nothing to rotate and no monthly
re-paste.

> **If your browser shows "This site can't be reached" after you type the code**,
> nothing is broken — the sign-in worked and only the hand-back failed. Copy the
> whole address from the browser's address bar and paste it back to your assistant,
> which can finish from there.

> **Rarely, Claude Code may say it needs to connect you to the content server
> first.** Let it — a one-off setup step, after which it'll ask you to restart
> Claude Code and try again. This only happens if the plugin's own registration
> was blocked, usually by another connector on your account using the same
> address. Normally you'll never see it. In Copilot there is no automatic
> registration to be blocked: if the assistant says the server isn't connected,
> step 1 of the Copilot install above hasn't happened yet.

## Access tiers

Your tier is decided by the email address you sign in with:

- **Free tier** — lesson summaries, and coaching from them. No purchase, no card,
  just a sign-in.
- **Paid tier** — full lesson bodies as Dave wrote them, with his worked examples
  and commentary.

Signing in is required either way: the free tier is a signed-in session carrying no
courses, not the absence of a sign-in.

## Get the course

The ATDD course is at
**[courses.cd.training](https://courses.cd.training/collections)**.

Buy it, then sign in with the same address, and the commands you already have
teach from the full lessons. There's nothing to re-enter and nothing to reinstall.

## Verify it's working

After installing, run `/msec:atdd-learn` (Claude Code) or `/atdd-learn` (VS Code)
and pick a topic — or, in any Copilot host, just ask a question about acceptance
testing. Your assistant will fetch the lesson from the content server and start
coaching. If you see your tier announced (free or paid) and real lesson content,
you're set.


## Using this at work

These skills are prompt files, not a program. If your organisation reviews
third-party tooling, here's what a reviewer needs.

**What gets installed on your machine**

Markdown and JSON only: four `SKILL.md` skill files, four optional VS Code prompt
files, two Claude Code plugin manifests, one VS Code `mcp.json`, a README and a
`.gitignore`. **No executable code, no scripts, no hooks** (this fork adds one
optional script, the VS Code workaround described above; upstream has none). This repository is
public, so you can read all of it before installing.

**What leaves your machine**

| | |
|---|---|
| Your email address | At sign-in, to identify which courses you own |
| Short search terms | e.g. `testability`, `ports and adapters`, or a lesson id |
| **Your source code** | **Never.** The content server accepts topics and lesson ids only — there is no tool that takes code |

Your code stays between you and your AI provider (Anthropic or GitHub), exactly
as it does without this plugin. It is never sent to CD.Training.

**Who it talks to**

`msec-mcp-production.fly.dev` — the course content server, and the only service the
plugin itself contacts. Signing in happens in your browser on our sign-in page,
which uses a bot check and sends your code by email, as any sign-in page does.

**Where your session is stored**

Your host stores it, not this plugin. In Claude Code, on macOS that's the system
Keychain; on Windows it's `%USERPROFILE%\.claude\.credentials.json`, a file
readable only by your own account and local administrators. In VS Code it's the
editor's secret storage, backed by the operating system's credential store; the
Copilot CLI keeps it under `~/.copilot`. In every case it is outside your project
directory and never in this repository.

*(Claude Code verified September 2026 on macOS 26 and Windows Server 2025.)*

**Who can change this repository**

Two named administrators. Every change is a public commit, and the copy installed
on your machine records the exact commit it came from, so you can diff what you
have against what's published.
