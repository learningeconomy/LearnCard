import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// These native patches call into each other. Upgrade the pair and its proof together.
const versions = { '@capacitor/android': '8.5.2', '@capacitor/keyboard': '8.0.6' };
const workspaces = ['apps/learn-card-app', 'apps/scouts', 'packages/learn-card-base'];

// Bun's text lockfile is JSON with trailing commas. Remove only commas outside
// strings, so package names/integrities remain data rather than executable code.
export const parseLockfile = text => {
    let result = '';
    let quoted = false;
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (!quoted && char === ',' && /^[\s]*[}\]]/.test(text.slice(i + 1))) continue;
        result += char;
        if (escaped) escaped = false;
        else if (quoted && char === '\\') escaped = true;
        else if (char === '"') quoted = !quoted;
    }
    return JSON.parse(result);
};

export const checkKeyboardPatches = ({ manifest, manifests, lock, patchExists }) => {
    const errors = [];
    for (const [name, version] of Object.entries(versions)) {
        const key = `${name}@${version}`;
        const patch = `patches/${name.replaceAll('/', '%2F')}@${version}.patch`;
        if (
            manifest.patchedDependencies?.[key] !== patch ||
            lock.patchedDependencies?.[key] !== patch
        ) {
            errors.push(`${key}: root manifest and lockfile must both declare ${patch}`);
        }
        if (!patchExists(patch)) errors.push(`${key}: patch file is missing`);
        const resolutions = Object.values(lock.packages).filter(entry =>
            entry[0].startsWith(`${name}@`)
        );
        if (!resolutions.length || resolutions.some(entry => entry[0] !== key)) {
            errors.push(
                `${name}: every resolved version must be ${version}; port both native patches before upgrading`
            );
        }
        for (const [path, pkg] of Object.entries(manifests)) {
            for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
                const declared = pkg[section]?.[name];
                if (declared === undefined) continue;
                if (declared !== version || lock.workspaces[path]?.[section]?.[name] !== version) {
                    errors.push(`${path}: pin ${name} to ${version} in package.json and bun.lock`);
                }
            }
        }
    }
    return errors;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
    const errors = checkKeyboardPatches({
        manifest: json('package.json'),
        manifests: Object.fromEntries(workspaces.map(path => [path, json(`${path}/package.json`)])),
        lock: parseLockfile(readFileSync(resolve(root, 'bun.lock'), 'utf8')),
        patchExists: path => existsSync(resolve(root, path)),
    });
    if (errors.length) {
        console.error(errors.join('\n'));
        process.exitCode = 1;
    } else console.log('Native keyboard patch versions, pins, and files agree.');
}
