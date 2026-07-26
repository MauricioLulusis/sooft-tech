import path from 'node:path';
import { homeDir, exists, readJson, writeJson } from './util.mjs';
import { STATE_DIR } from './constants.mjs';

/**
 * User-level config for the CLI, at `~/.sooft/config.json`. Currently holds the
 * `source` for `sooft agent install` (a git URL or local path), so the developer
 * sets it once (`sooft agent source <url>`) and then just runs `agent install`.
 */
function configPath() {
  return path.join(homeDir(), STATE_DIR, 'config.json');
}

export function readConfig() {
  const p = configPath();
  if (!exists(p)) return {};
  try {
    return readJson(p);
  } catch {
    return {};
  }
}

export function writeConfig(config) {
  writeJson(configPath(), config);
}

export function getSource() {
  return readConfig().source || null;
}

export function setSource(source) {
  const config = readConfig();
  config.source = source;
  writeConfig(config);
  return config;
}

export function clearSource() {
  const config = readConfig();
  delete config.source;
  writeConfig(config);
  return config;
}
