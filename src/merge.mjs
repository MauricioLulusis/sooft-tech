import { exists, readJson, writeJson } from './util.mjs';

/**
 * Every hook group Sooft merges into an agent's settings file is stamped with
 * `_sooftPack: <name>`. That stamp is what makes installs additive and removal
 * exact: we never touch a group we didn't add, and we can pull ours back out
 * without disturbing hand-written hooks or another pack's.
 */
const STAMP = '_sooftPack';

function loadSettings(settingsPath) {
  if (!exists(settingsPath)) return {};
  try {
    return readJson(settingsPath);
  } catch (err) {
    throw new Error(`cannot merge into ${settingsPath}: invalid JSON (${err.message})`);
  }
}

/**
 * Merge a pack's hooks (a `{ hooks: { Event: [group...] } }` manifest) into the
 * agent settings file, stamping each group. Idempotent: re-running first strips
 * this pack's previous groups, so `add` → `update` never duplicates.
 *
 * Returns the list of event names that received groups.
 */
export function mergeHooks(settingsPath, packName, hooksManifest) {
  const settings = loadSettings(settingsPath);
  const incoming = (hooksManifest && hooksManifest.hooks) || {};
  if (!settings.hooks) settings.hooks = {};

  const events = [];
  for (const [event, groups] of Object.entries(incoming)) {
    if (!Array.isArray(groups)) continue;
    // Drop any prior groups this pack placed for this event (idempotency).
    const existing = (settings.hooks[event] || []).filter((g) => g[STAMP] !== packName);
    const stamped = groups.map((g) => ({ ...g, [STAMP]: packName }));
    settings.hooks[event] = [...existing, ...stamped];
    events.push(event);
  }

  writeJson(settingsPath, settings);
  return events;
}

/**
 * Remove every group a pack placed. Prunes now-empty event arrays and the
 * `hooks` object itself so we leave the file as clean as we found it.
 */
export function unmergeHooks(settingsPath, packName) {
  if (!exists(settingsPath)) return [];
  const settings = loadSettings(settingsPath);
  if (!settings.hooks) return [];

  const removed = [];
  for (const [event, groups] of Object.entries(settings.hooks)) {
    if (!Array.isArray(groups)) continue;
    const kept = groups.filter((g) => g[STAMP] !== packName);
    if (kept.length !== groups.length) removed.push(event);
    if (kept.length === 0) delete settings.hooks[event];
    else settings.hooks[event] = kept;
  }
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

  writeJson(settingsPath, settings);
  return removed;
}
