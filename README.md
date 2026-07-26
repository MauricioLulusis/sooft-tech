<div align="center">

```
███████╗ ██████╗  ██████╗ ███████╗████████╗
██╔════╝██╔═══██╗██╔═══██╗██╔════╝╚══██╔══╝
███████╗██║   ██║██║   ██║█████╗     ██║
╚════██║██║   ██║██║   ██║██╔══╝     ██║
███████║╚██████╔╝╚██████╔╝██║        ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝        ╚═╝
```

**Sooft Technology · AI Engineering**

</div>

# sooft

`sooft` is the **AI agent assets manager** for Sooft Technology — one command to
distribute your engineering conventions (**rules / steering files**) and
lifecycle **hooks** to every AI coding agent on the team, from a shared Git repo.

Author your standards once; install them in each agent's native format
([Claude Code](https://claude.com/claude-code), Cursor). The install is a
**plan → approve → merge** flow: additive, idempotent, and exactly reversible.

```bash
npx sooft add sooft-tech/standards      # plan → approve → merge
npx sooft list                          # what's installed, and where
npx sooft remove sooft-standards        # remove exactly what a pack placed
```

## Why

AI coding agents only follow the conventions they can see. Copy-pasting rules and
hooks into every repo and every agent config drifts instantly. `sooft` treats
those assets as a **versioned, installable package** — publish once, install
everywhere, update on demand, remove cleanly.

- **One command, many agents.** Auto-detects Claude Code / Cursor in the
  workspace and places assets in each agent's native location.
- **Nothing runs silently.** Hooks are commands the agent executes on its own
  lifecycle, so `add` always shows the full plan and asks before writing.
- **Merge, never clobber.** Hook blocks are stamped per pack, so installs are
  additive and `remove` pulls out exactly what a pack contributed — your
  hand-written config and other packs are never touched.
- **Zero dependencies.** Pure Node ESM. Runs with `node`, `npx`, or a global
  install — no build step, no runtime deps.

## Install

```bash
npm i -g @sooft/cli        # the `sooft` command is now on your PATH
# or run without installing:
npx @sooft/cli <command>
```

Requires **Node ≥ 18**.

## Quick start

```bash
# 1. Scaffold a pack (rules + hooks) and publish it to a Git repo
sooft init sooft-standards

# 2. In any repo, install it
sooft add sooft-tech/standards          # owner/repo
sooft add ./sooft-standards             # local path
sooft add https://git.example.com/team/standards.git   # any git remote

# 3. Manage it
sooft list                              # installed packs + placements
sooft check                             # detect drift from the manifest
sooft remove sooft-standards            # clean removal
sooft doctor                            # environment + workspace health
```

## Sooft AI Rails — one command, every tool

`sooft agent install` distributes the **Sooft Engineering AI Rails** methodology
(the [`sooft-ai-standards`](https://github.com/sooft-tech/sooft-ai-standards) repo —
skills, subagents, hooks and instructions) into **every** AI coding tool it detects:
Claude Code, GitHub Copilot (CLI + VS Code), Cursor, Kiro, Windsurf, and generic
`.agents/`. Each tool gets the artifacts in its **native** location.

```bash
sooft agent source sooft-tech/sooft-ai-standards   # set the source once (repo, git URL, or path)
sooft agent install                                # install into every detected tool
sooft agent install --all                          # ...or force all supported tools
sooft agent install --dry-run                      # preview the plan, write nothing
sooft agent update                                 # re-install, replacing the previous placement
sooft agent remove                                 # remove exactly what was placed
```

| Tool | Gets |
| --- | --- |
| **Claude Code** | skills → `.claude/skills/`, subagents → `.claude/agents/` |
| **GitHub Copilot** | subagents, prompts, hooks → `.github/`, instructions → `.github/copilot-instructions.md` |
| **Cursor** | rules → `.cursor/rules/sooft-ai-rails.mdc` |
| **Kiro** | steering → `.kiro/steering/sooft-ai-rails.md` |
| **Windsurf** | rules → `.windsurf/rules/sooft-ai-rails.md` |
| **Generic** | skills → `.agents/skills/` |

Every placement is recorded in `.sooft/manifest.json`, so `agent remove` is exact
and reversible. The methodology enforces human **approval gates** (PRD → SPEC →
PLAN → code → review): the agent never writes code without an approved plan.

## Commands

| Command | Description |
| --- | --- |
| `agent install` | Install Sooft AI Rails into every detected AI tool (`--all`, `--dry-run`) |
| `agent update` | Re-install the standards, replacing the previous placement |
| `agent remove` | Remove everything the standards install placed |
| `agent source [url]` | Show or set the standards source (`owner/repo`, git URL, or path) |
| `init [name]` | Scaffold a Sooft asset pack (`sooft.pack.json` + rules + hooks) |
| `add <source>` | Install a pack from `owner/repo[/subdir][@ref]`, a git URL, or a local path — plan → approve → merge |
| `list`, `ls` | Installed packs per scope, with placement summary |
| `check` | Verify placed files still match the manifest (drift detection) |
| `remove <name>`, `rm` | Remove exactly the files + hook entries a pack contributed |
| `doctor` | Runtime, detected agents, and workspace state |

**Flags:** `-g/--global` (home scope), `--agent <name>` (repeatable: `claude`,
`cursor`), `-y/--yes` (skip approval), `--dry-run` (preview only), `--json`,
`--no-banner`, `-v/--version`, `-h/--help`.

**Exit codes:** `0` ok · `1` refused/failed · `2` usage · `3` nothing placed.

## Pack format

A **Sooft asset pack** is a directory with a `sooft.pack.json` manifest:

```jsonc
{
  "name": "sooft-standards",
  "version": "1.0.0",
  "description": "Sooft engineering conventions",
  "rules": ["rules/engineering.md"],   // markdown distributed to agents
  "hooks": "hooks.json"                 // optional lifecycle hooks
}
```

`hooks.json` uses the Claude Code hooks shape (`SessionStart`, `PostToolUse`, …).
Scaffold a ready-to-edit pack with `sooft init`.

## Placement targets

| Agent | Rules | Hooks |
| --- | --- | --- |
| **Claude Code** | `.claude/rules/<pack>-<file>.md` | merged into `.claude/settings.json` |
| **Cursor** | `.cursor/rules/<pack>-<file>.mdc` | merged into `.cursor/hooks.json` |

Without `--agent`, targets are auto-detected from the workspace, falling back to
Claude Code. Use `-g` to place into the user home scope instead of the repo.

## Environment

- `SOOFT_NO_BANNER` — hide the wordmark banner.
- `NO_COLOR` — disable color (the banner still prints, uncolored).
- `FORCE_COLOR` — force color even when output is piped.
- `GITHUB_TOKEN` / `GH_TOKEN` — used by git for private repos.

## Development

```bash
npm test              # run the suite (Node's built-in test runner, zero deps)
npm run sooft -- --help
```

- **Runtime:** Node ≥ 18, ESM, zero runtime dependencies.
- **Layout:** `bin/` launcher · `src/` modules + `src/commands/` · `tests/`.
- **Style:** lowercase-with-hyphens filenames, `const` over `let`, small modules.

## License

MIT © Sooft Technology
