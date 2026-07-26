/**
 * Brand + placement constants for the Sooft CLI.
 */

export const BRAND = {
  name: 'Sooft',
  wordmark: 'SOOFT',
  company: 'Sooft Technology',
  slogan: 'Sooft Technology · AI Engineering',
  tagline: 'AI agent assets manager',
  url: 'https://sooft.tech',
};

/** Brand gradient (top → bottom of the wordmark): violet → sky. */
export const GRADIENT = {
  from: [168, 132, 255], // violet
  to: [56, 205, 230], // sky/teal
};

/** Local project state — the manifest of everything Sooft has installed here. */
export const STATE_DIR = '.sooft';
export const MANIFEST_FILE = 'manifest.json';

/** A pack's metadata file, at the root of a Sooft asset pack. */
export const PACK_FILE = 'sooft.pack.json';

/**
 * Placement targets per supported agent. `rules` files are copied into the
 * agent's native rules location; `settings` is the JSON file hook blocks merge
 * into. Removal is exact because every write is recorded in the manifest.
 */
export const AGENTS = {
  claude: {
    label: 'Claude Code',
    detect: ['.claude', 'CLAUDE.md'],
    rulesDir: '.claude/rules',
    rulesExt: '.md',
    settings: '.claude/settings.json',
  },
  cursor: {
    label: 'Cursor',
    detect: ['.cursor'],
    rulesDir: '.cursor/rules',
    rulesExt: '.mdc',
    settings: '.cursor/hooks.json',
  },
};

export const DEFAULT_AGENT = 'claude';

/**
 * `sooft agent` — the standards installer. Distributes the Sooft Engineering AI
 * Rails content (skills, subagents, hooks, instructions) into each tool's native
 * location. Capabilities differ per tool; a missing key means "this tool doesn't
 * take that artifact". Placement is recorded in the manifest for exact removal.
 */
export const TOOLS = {
  claude: {
    label: 'Claude Code',
    detect: ['.claude', 'CLAUDE.md'],
    skillsDir: '.claude/skills', // auto-discovered by Claude Code
    agentsDir: '.claude/agents', // *.md subagents
  },
  copilot: {
    label: 'GitHub Copilot',
    detect: ['.github/copilot-instructions.md', '.github'],
    agentsDir: '.github/agents', // *.agent.md
    instructions: '.github/copilot-instructions.md',
    promptsDir: '.github/prompts', // *.prompt.md
    hooksDir: '.github/hooks', // sooft.json + banner.txt
  },
  cursor: {
    label: 'Cursor',
    detect: ['.cursor'],
    rulesFile: '.cursor/rules/sooft-ai-rails.mdc',
  },
  kiro: {
    label: 'Kiro',
    detect: ['.kiro'],
    rulesFile: '.kiro/steering/sooft-ai-rails.md',
  },
  windsurf: {
    label: 'Windsurf',
    detect: ['.windsurf'],
    rulesFile: '.windsurf/rules/sooft-ai-rails.md',
  },
  agents: {
    label: 'Generic (.agents)',
    detect: ['.agents'],
    skillsDir: '.agents/skills',
  },
};

/** Tools installed to when nothing is detected and no --agent/--all is given. */
export const DEFAULT_TOOLS = ['claude', 'copilot'];

/** Manifest key under which an `agent install` records its placements. */
export const STANDARDS_PACK = 'sooft-ai-standards';

/** Exit codes — frozen contract for scripts and CI. */
export const EXIT = {
  ok: 0,
  error: 1,
  usage: 2,
  nothingPlaced: 3,
};
