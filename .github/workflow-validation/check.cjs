const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');
const { actionlintVersion } = require('./package.json');

const githubYaml = root => {
    const files = [];
    const visit = directory => {
        for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
            if (entry.name === 'node_modules') continue;
            const file = `${directory}/${entry.name}`;
            if (entry.isDirectory()) visit(file);
            else if (entry.isFile() && /\.ya?ml$/.test(entry.name)) files.push(file);
        }
    };
    visit('.github');
    return files.sort();
};

// Compensate for the two exact stale-metadata exceptions in actionlint.yaml.
// These are presence checks; configured secret/variable values are never read.
const checkAppTokenInputs = (value, file, errors) => {
    if (!value || typeof value !== 'object') return;
    if (value.uses === 'actions/create-github-app-token@v3') {
        const inputs = value.with ?? {};
        const present = key =>
            ['string', 'number'].includes(typeof inputs[key]) && String(inputs[key]).trim() !== '';
        if (!present('app-id') && !present('client-id')) {
            errors.push(`${file}: create-github-app-token@v3 requires app-id or client-id.`);
        }
        if (!present('private-key')) {
            errors.push(`${file}: create-github-app-token@v3 requires private-key.`);
        }
    }
    for (const child of Object.values(value)) checkAppTokenInputs(child, file, errors);
};

const validate = (root, executable = process.env.ACTIONLINT || 'actionlint') => {
    const files = githubYaml(root);
    const errors = [];
    for (const file of files) {
        try {
            // Default strict mapping behavior rejects duplicate keys, including
            // quoted/unquoted spellings. Do not use json:true (last key wins).
            const document = yaml.load(readFileSync(path.join(root, file), 'utf8'), {
                filename: file,
            });
            checkAppTokenInputs(document, file, errors);
        } catch (error) {
            errors.push(error.message);
        }
    }
    if (errors.length) return { status: 1, output: errors.join('\n') };

    const version = spawnSync(executable, ['-version'], { encoding: 'utf8' });
    // Release archives report 1.x.y; Go module builds report v1.x.y.
    const reportedVersion = version.stdout?.split('\n')[0].trim().replace(/^v/, '');
    if (version.error || version.status !== 0 || reportedVersion !== actionlintVersion) {
        return {
            status: 1,
            output: `Install actionlint v${actionlintVersion}; set ACTIONLINT to its executable if needed.`,
        };
    }
    const workflows = files.filter(file => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file));
    if (!workflows.length) return { status: 1, output: 'No GitHub workflows found.' };
    const result = spawnSync(executable, ['-shellcheck=', '-pyflakes=', ...workflows], {
        cwd: root,
        encoding: 'utf8',
    });
    return {
        status: result.error ? 1 : (result.status ?? 1),
        output:
            result.error?.message ||
            `${result.stdout || ''}${result.stderr || ''}` ||
            `Validated ${workflows.length} workflows and strictly parsed ${files.length} GitHub YAML files.`,
    };
};

if (require.main === module) {
    const result = validate(path.resolve(__dirname, '../..'));
    console.log(result.output);
    process.exitCode = result.status;
}
module.exports = { validate };
