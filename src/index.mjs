/**
 * Public programmatic entry point for @sooft/cli.
 *
 * The CLI is the primary interface, but these exports let scripts drive the
 * same logic (e.g. install packs in a setup step) without spawning a process.
 */
export { run, parseArgs } from './cli.mjs';
export { loadPack, isPackDir } from './pack.mjs';
export { resolveSource } from './source.mjs';
export { detectAgents, resolveTargets } from './agents.mjs';
export { readManifest, listPacks } from './manifest.mjs';
export { mergeHooks, unmergeHooks } from './merge.mjs';
export { banner } from './banner.mjs';
export { BRAND } from './constants.mjs';
export { VERSION } from './version.mjs';
