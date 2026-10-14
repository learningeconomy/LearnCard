import fs from 'node:fs';
import path from 'node:path';

// Keep workspace paths intact for Bun's development exports and Compose mounts.
// Follow runtime dependencies rather than maintaining a second package allowlist.
const root = process.cwd();
const destination = process.argv[2];
if (!destination) throw new Error('Usage: bun prepare-backend-source.mjs <destination>');

const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const workspaces = new Map();
for (const pattern of manifest.workspaces) {
    for (const filename of new Bun.Glob(`${pattern}/package.json`).scanSync(root)) {
        const workspace = JSON.parse(fs.readFileSync(filename, 'utf8'));
        workspaces.set(workspace.name, { directory: path.dirname(filename), manifest: workspace });
    }
}

const selected = new Set();
const pending = [
    '@learncard/network-brain-service',
    '@learncard/learn-cloud-service',
    '@learncard/lca-api-service',
];
while (pending.length) {
    const name = pending.pop();
    if (selected.has(name)) continue;
    const workspace = workspaces.get(name);
    if (!workspace) throw new Error(`Backend workspace not found: ${name}`);
    selected.add(name);
    const dependencies = {
        ...workspace.manifest.dependencies,
        ...workspace.manifest.optionalDependencies,
        ...workspace.manifest.peerDependencies,
    };
    pending.push(...Object.keys(dependencies).filter(dependency => workspaces.has(dependency)));
}

fs.mkdirSync(destination, { recursive: true });
for (const name of selected) {
    const { directory } = workspaces.get(name);
    fs.cpSync(directory, path.join(destination, directory), {
        recursive: true,
        filter: filename =>
            !path
                .relative(root, filename)
                .split(path.sep)
                .some(
                    part =>
                        [
                            'node_modules',
                            'dist',
                            'coverage',
                            '__tests__',
                            'test-results',
                            'playwright-report',
                            '.git',
                        ].includes(part) ||
                        part === '.env' ||
                        part.startsWith('.env.')
                ),
    });
}
for (const filename of new Bun.Glob('tsconfig*.json').scanSync(root)) {
    fs.copyFileSync(filename, path.join(destination, filename));
}
console.log(`Prepared source for ${selected.size} backend workspaces`);
