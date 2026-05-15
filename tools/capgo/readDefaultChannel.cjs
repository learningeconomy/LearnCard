#!/usr/bin/env node
// tools/capgo/readDefaultChannel.cjs
//
// Shared reader for the Capgo `defaultChannel` SSOT in an app's
// `capacitor.config.ts`. Used by:
//   - tools/capgo/getCapgoChannel.js (CI — picks OTA upload channel)
//   - tools/capgo/check-channel-bump.js (CI — detects native compat breaks)
//   - apps/learn-card-app/scripts/prepare-native-config.ts (build — patches platform JSONs)
//
// All consumers MUST go through this helper. Forking the regex re-introduces
// the silent drift class fixed in PR #1063 (binaries listening on a different
// channel than CI uploads to).

const fs = require('fs');

// Scoped to inside the `CapacitorUpdater: { ... }` block so a sibling plugin
// that gains its own `defaultChannel` field can't accidentally shadow ours.
// `[^}]*?` lazy-matches everything up to the first `}` after CapacitorUpdater.
const CAPGO_CHANNEL_REGEX = /CapacitorUpdater\s*:\s*\{[^}]*?defaultChannel\s*:\s*['"]([^'"]+)['"]/;

/**
 * Parse the Capgo `defaultChannel` value out of a Capacitor config source
 * string. Pure function — use this when the source comes from somewhere
 * other than the local filesystem (e.g. `git show <sha>:<path>`).
 *
 * @param {string} content - capacitor.config.ts source
 * @returns {string | undefined}
 */
function parseDefaultChannel(content) {
    if (!content) return undefined;

    return content.match(CAPGO_CHANNEL_REGEX)?.[1];
}

/**
 * Read the Capgo `defaultChannel` value from a Capacitor config TS file on disk.
 *
 * @param {string} configPath - Absolute path to capacitor.config.ts
 * @returns {string | undefined} - The channel value, or undefined if the file
 *   can't be read or the regex doesn't match.
 */
function readDefaultChannel(configPath) {
    let content;

    try {
        content = fs.readFileSync(configPath, 'utf-8');
    } catch {
        return undefined;
    }

    return parseDefaultChannel(content);
}

module.exports = { readDefaultChannel, parseDefaultChannel, CAPGO_CHANNEL_REGEX };
