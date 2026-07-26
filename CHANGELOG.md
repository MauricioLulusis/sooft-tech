# Changelog

All notable changes to `@sooft/cli` are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); versioning is
[SemVer](https://semver.org/).

## [0.1.0] - 2026-07-26

### Added

- Initial release of the `sooft` CLI — the AI agent assets manager for Sooft
  Technology.
- Wordmark banner (`SOOFT`) with the `Sooft Technology · AI Engineering` slogan.
- Commands: `init`, `add`, `list`, `check`, `remove`, `doctor`.
- Pack format (`sooft.pack.json`) distributing rules + lifecycle hooks.
- Placement for Claude Code and Cursor with plan → approve → merge, additive
  merges, and exact removal via a per-repo manifest.
- Source resolution for local paths, GitHub shorthand, and any git remote.
- Zero-dependency ESM; test suite on Node's built-in runner.
