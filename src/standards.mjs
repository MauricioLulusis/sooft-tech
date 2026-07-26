import path from 'node:path';
import { exists, isDir, listDirs, listFiles, readText } from './util.mjs';

/**
 * Read the content model of a `sooft-ai-standards` source tree so the installer
 * knows what to place, independent of any single tool's layout.
 *
 *   skills/<name>/SKILL.md         → skills (each a self-contained dir)
 *   .github/agents/*.agent.md      → subagents (Copilot CLI format)
 *   .github/copilot-instructions.md→ instructions for Copilot
 *   AGENTS.md                      → canonical instructions (Claude/others)
 *   skills/sooft/assets/prompts/*  → slash-command prompt files
 *   .github/hooks/                 → sessionStart hook + banner
 */
export function resolveStandards(root) {
  if (!isDir(root)) throw new Error(`standards source not found: ${root}`);

  const skillsRoot = path.join(root, 'skills');
  const skills = listDirs(skillsRoot)
    .filter((name) => exists(path.join(skillsRoot, name, 'SKILL.md')))
    .map((name) => ({ name, dir: path.join(skillsRoot, name) }));

  if (!skills.length) {
    throw new Error(`not a sooft-ai-standards source: no skills/*/SKILL.md under ${root}`);
  }

  const agentsDir = path.join(root, '.github', 'agents');
  const agents = listFiles(agentsDir, '.agent.md').map((file) => ({
    // sooft-code-reviewer.agent.md → sooft-code-reviewer
    name: file.replace(/\.agent\.md$/, ''),
    file: path.join(agentsDir, file),
    base: file,
  }));

  const promptsDir = path.join(root, 'skills', 'sooft', 'assets', 'prompts');
  const prompts = listFiles(promptsDir, '.prompt.md').map((file) => ({
    file: path.join(promptsDir, file),
    base: file,
  }));

  const hooksDir = path.join(root, '.github', 'hooks');
  const hooks = isDir(hooksDir) ? { dir: hooksDir, files: listFiles(hooksDir) } : null;

  const agentsMd = path.join(root, 'AGENTS.md');
  const copilotMd = path.join(root, '.github', 'copilot-instructions.md');

  return {
    root,
    skills,
    agents,
    prompts,
    hooks,
    instructions: exists(agentsMd) ? agentsMd : null,
    copilotInstructions: exists(copilotMd) ? copilotMd : null,
  };
}

/** Build the content of a single-file rule/steering doc from the canonical instructions. */
export function instructionsAsRule(std, { mdc = false } = {}) {
  const body = std.instructions ? readText(std.instructions) : '# Sooft Engineering AI Rails\n';
  if (mdc) {
    return `---\ndescription: Sooft Engineering AI Rails — metodología y gates\nalwaysApply: true\n---\n\n${body}`;
  }
  return body;
}
