import fs from 'node:fs';
import path from 'node:path';

const CLIENT_PACKAGES = new Set([
    '@learncard/network-brain-client',
    '@learncard/learn-cloud-client',
]);

/**
 * Keep workspace development on source, but publish only the self-contained build.
 * Used by the release manifest preparation and isolated consumer checks.
 * Mutates the supplied in-memory manifest only after checking all built targets.
 */
export const prepareClientExports = (manifest, directory) => {
    if (!CLIENT_PACKAGES.has(manifest.name)) return false;
    const entry = manifest.exports?.['.'];
    for (const format of ['import', 'require']) {
        for (const kind of ['types', 'default']) {
            const target = entry?.[format]?.[kind];
            if (
                typeof target !== 'string' ||
                !target.startsWith('./dist/') ||
                !fs.existsSync(path.join(directory, target))
            ) {
                throw new Error(
                    `Client publish target missing: ${manifest.name} ${format}.${kind} (${target})`
                );
            }
        }
    }
    let changed = false;
    if (Object.hasOwn(entry, 'development')) {
        delete entry.development;
        changed = true;
    }
    if (manifest.files?.includes('src')) {
        manifest.files = manifest.files.filter(file => file !== 'src');
        changed = true;
    }
    return changed;
};
