const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const digestFile = file => {
    const hash = createHash('sha256');
    const fd = fs.openSync(file, 'r');
    const buffer = Buffer.allocUnsafe(64 * 1024);
    try {
        let count;
        while ((count = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
            hash.update(buffer.subarray(0, count));
        }
    } finally {
        fs.closeSync(fd);
    }
    return hash.digest('hex');
};

const snapshot = (root, sha, label) => {
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(sha) || !['full', 'shadow'].includes(label)) {
        throw new Error('Invalid snapshot identity');
    }
    const actualHead = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
    }).trim();
    if (actualHead !== sha) throw new Error('Checkout does not match expected commit');
    const status = execFileSync(
        'git',
        ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'],
        { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
    );
    const entries = Object.create(null);
    for (const item of status.split('\0').filter(Boolean)) {
        const flags = item.slice(0, 2);
        const name = item.slice(3);
        if (item[2] !== ' ' || !name || path.isAbsolute(name) || name.split('/').includes('..')) {
            throw new Error('Invalid Git status entry');
        }
        const file = path.join(root, name);
        let kind = 'missing';
        let mode = 'missing';
        let hash = null;
        try {
            const stats = fs.lstatSync(file);
            if (stats.isSymbolicLink()) {
                kind = 'symlink';
                mode = '120000';
                hash = createHash('sha256').update(fs.readlinkSync(file)).digest('hex');
            } else if (stats.isFile()) {
                kind = 'file';
                mode = stats.mode & 0o111 ? '100755' : '100644';
                hash = digestFile(file);
            } else {
                throw new Error('Unsupported Git status entry type');
            }
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
        entries[name] = { tracked: flags !== '??', status: flags, kind, mode, hash };
    }
    return { version: 1, sha, label, entries };
};

const compare = (actual, shadow) => {
    if (
        actual?.version !== 1 ||
        shadow?.version !== 1 ||
        !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(actual.sha) ||
        actual.sha !== shadow.sha ||
        actual.label !== 'full' ||
        shadow.label !== 'shadow' ||
        !actual.entries ||
        typeof actual.entries !== 'object' ||
        !shadow.entries ||
        typeof shadow.entries !== 'object' ||
        Array.isArray(actual.entries) ||
        Array.isArray(shadow.entries)
    )
        throw new Error('Snapshot identities do not match');
    const result = {
        tracked: { match: [], actualOnly: [], shadowOnly: [], different: [] },
        untracked: { match: [], actualOnly: [], shadowOnly: [], different: [] },
    };
    const names = [
        ...new Set([...Object.keys(actual.entries), ...Object.keys(shadow.entries)]),
    ].sort();
    for (const name of names) {
        const a = actual.entries[name];
        const s = shadow.entries[name];
        for (const entry of [a, s].filter(Boolean)) {
            if (
                typeof entry.tracked !== 'boolean' ||
                typeof entry.status !== 'string' ||
                entry.status.length !== 2 ||
                entry.tracked === (entry.status === '??') ||
                !['file', 'symlink', 'missing'].includes(entry.kind) ||
                (entry.kind === 'file' && !['100644', '100755'].includes(entry.mode)) ||
                (entry.kind === 'symlink' && entry.mode !== '120000') ||
                (entry.kind === 'missing' && entry.mode !== 'missing') ||
                (entry.kind === 'missing'
                    ? entry.hash !== null
                    : !/^[a-f0-9]{64}$/.test(entry.hash))
            )
                throw new Error('Invalid snapshot entry');
        }
        if (a && s && a.tracked !== s.tracked) {
            result.tracked.different.push(name);
            result.untracked.different.push(name);
            continue;
        }
        const bucket = (a || s).tracked ? result.tracked : result.untracked;
        if (!a) bucket.shadowOnly.push(name);
        else if (!s) bucket.actualOnly.push(name);
        else if (
            a.status === s.status &&
            a.kind === s.kind &&
            a.mode === s.mode &&
            a.hash === s.hash
        )
            bucket.match.push(name);
        else bucket.different.push(name);
    }
    return result;
};

const render = comparison => {
    const lines = [
        '## Maid-Service generator shadow comparison',
        '',
        'Comparison of final Git-visible changes at the same commit, after installation and each command. Equal output in one run is not proof that all affected selections are covered.',
        'Maid currently gates housekeeping on tracked changes, then `git add .` can include untracked files.',
        'Generator-only changes can occur when the full Nx selection does not run the React build. This comparison does not record whether that build ran.',
        ...(Object.keys(comparison).every(type =>
            Object.values(comparison[type]).every(paths => paths.length === 0)
        )
            ? [
                  'No changed files were observed in either checkout; this is not a positive coverage test.',
              ]
            : []),
        '',
    ];
    for (const [type, data] of Object.entries(comparison)) {
        lines.push(`### ${type === 'tracked' ? 'Tracked' : 'Untracked'} files`, '');
        for (const [key, title] of [
            ['match', 'Same path and state'],
            ['actualOnly', 'Full run only'],
            ['shadowOnly', 'Generator only'],
            ['different', 'Different state or contents'],
        ]) {
            lines.push(`- ${title}: **${data[key].length}**`);
            for (const name of data[key].slice(0, 100)) {
                lines.push(
                    `  - ${JSON.stringify(name)
                        .replace(/[<>]/g, c => (c === '<' ? '&lt;' : '&gt;'))
                        .replace(/[\\`*_{}\[\]()!|#]/g, '\\$&')
                        .slice(0, 500)}`
                );
            }
            if (data[key].length > 100) lines.push('  - Additional paths omitted.');
        }
        lines.push('');
    }
    return lines.join('\n');
};

const main = () => {
    const [, , command, ...args] = process.argv;
    if (command === 'snapshot' && args.length === 2) {
        const [label, destination] = args;
        fs.writeFileSync(
            destination,
            JSON.stringify(snapshot(process.cwd(), process.env.GITHUB_SHA, label))
        );
        return;
    }
    if (command === 'compare' && args.length === 2) {
        let summary;
        try {
            if (
                process.env.MAID_FULL_TEST_OUTCOME !== 'success' ||
                process.env.MAID_FULL_SNAPSHOT_OUTCOME !== 'success' ||
                process.env.MAID_SHADOW_GENERATOR_OUTCOME !== 'success' ||
                process.env.MAID_SHADOW_SNAPSHOT_OUTCOME !== 'success' ||
                process.env.MAID_FULL_DOWNLOAD_OUTCOME !== 'success' ||
                process.env.MAID_SHADOW_DOWNLOAD_OUTCOME !== 'success'
            )
                throw new Error(
                    'A test, generator, snapshot, or artifact transfer did not succeed'
                );
            const actual = JSON.parse(fs.readFileSync(args[0], 'utf8'));
            const shadow = JSON.parse(fs.readFileSync(args[1], 'utf8'));
            if (actual.sha !== process.env.GITHUB_SHA)
                throw new Error('Snapshot commit does not match this run');
            summary = render(compare(actual, shadow));
        } catch (error) {
            summary = `## Maid-Service generator shadow comparison\n\n**Inconclusive:** ${String(error.message).replace(/[\r\n<>]/g, ' ')}. No equivalence conclusion can be drawn.\n`;
        }
        if (process.env.GITHUB_STEP_SUMMARY)
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
        console.log(summary);
        return;
    }
    throw new Error(
        'Usage: maid-shadow.cjs snapshot <full|shadow> <path> | compare <full.json> <shadow.json>'
    );
};

if (require.main === module) main();
module.exports = { snapshot, compare, render };
