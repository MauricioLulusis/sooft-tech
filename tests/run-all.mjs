import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Run the whole suite with Node's built-in test runner — zero test deps.
 * Usage: `npm test` or `node tests/run-all.mjs`.
 */
// Run from the project root and let Node auto-discover `**/*.test.mjs`. Passing
// a directory to `--test` is not portable across Node versions; cwd discovery is.
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const result = spawnSync(process.execPath, ['--test'], { stdio: 'inherit', cwd: projectRoot });
process.exit(result.status ?? 1);
