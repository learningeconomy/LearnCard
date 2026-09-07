import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { z } from 'zod';

const BASELINE_PATH = 'scripts/eslint-baseline.json';
const REPOSITORY_PATH_PLACEHOLDER = '<repository>';
const concurrency = 2;

const walkProjectConfigs = (root: string): string[] => {
    if (!existsSync(root)) return [];

    const configs: string[] = [];

    for (const entry of readdirSync(root)) {
        const path = join(root, entry);
        const stats = statSync(path);

        if (stats.isDirectory()) {
            if (['node_modules', 'dist', 'build', '.git', '.nx', 'coverage'].includes(entry)) {
                continue;
            }
            configs.push(...walkProjectConfigs(path));
        } else if (entry === 'project.json') {
            configs.push(path);
        }
    }

    return configs;
};

const projectSourceRoots: string[] = [];
const LEGACY_LINT_EXCEPTIONS: Record<string, string> = {
    'apps/learn-card-app/src':
        'Legacy UI source remains enforced by lint-staged while React Compiler and Prettier debt is paid down.',
    'apps/scouts/src':
        'Legacy UI source remains enforced by lint-staged while React Compiler and Prettier debt is paid down.',
};

for (const path of walkProjectConfigs('.')) {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));

    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('sourceRoot' in parsed) ||
        typeof parsed.sourceRoot !== 'string'
    ) {
        throw new Error(`${path} must declare sourceRoot`);
    }

    if (LEGACY_LINT_EXCEPTIONS[parsed.sourceRoot]) continue;

    if (!projectSourceRoots.includes(parsed.sourceRoot)) {
        projectSourceRoots.push(parsed.sourceRoot);
    }
}

projectSourceRoots.sort();
const fullWorkspaceCohorts: readonly (readonly string[])[] = [
    [
        'eslint.config.mjs',
        'scripts/env-contracts.ts',
        'scripts/verify-lc-1984.ts',
        'scripts/lint-workspace.ts',
        'apps/learn-card-app/vite.config.mts',
        'apps/scouts/vite.config.ts',
        'apps/learn-card-app/src/config',
        'apps/scouts/src/config',
        'services/learn-card-network/brain-service/lambda.ts',
        'services/learn-card-network/brain-service/didWebLambda.ts',
        'services/learn-card-network/lca-api/lambda.ts',
        'services/learn-card-network/learn-cloud-service/lambda.ts',
        'services/learn-card-network/learn-cloud-service/didWebLambda.ts',
        'services/learn-card-network/learn-cloud-service/oidcLambda.ts',
        'services/learn-card-network/learn-cloud-service/xApiLambda.ts',
    ],
    ...projectSourceRoots.map(root => [root] as const),
];

const filesArgumentIndex = process.argv.indexOf('--files');
const filesMode = filesArgumentIndex !== -1;
const requestedFiles = filesMode
    ? process.argv
          .slice(filesArgumentIndex + 1)
          .filter(path => /\.(?:js|jsx|mjs|mts|ts|tsx)$/.test(path))
    : [];
const cohorts: readonly (readonly string[])[] = filesMode ? [requestedFiles] : fullWorkspaceCohorts;

const lintMessageSchema = z.object({
    ruleId: z.string().nullable(),
    severity: z.number(),
    message: z.string(),
    line: z.number().int().nonnegative().optional().default(0),
});
const lintResultSchema = z.object({
    filePath: z.string(),
    messages: z.array(lintMessageSchema),
});
const lintResultsSchema = z.array(lintResultSchema);
const baselineSchema = z.record(z.string(), z.record(z.string(), z.number().int().nonnegative()));

type LintResult = z.infer<typeof lintResultSchema>;
type Baseline = z.infer<typeof baselineSchema>;

const runCohort = (paths: readonly string[], index: number): Promise<LintResult[]> => {
    const existingPaths = paths.filter(existsSync);

    if (existingPaths.length === 0) return Promise.resolve([]);

    const { promise, resolve, reject } = Promise.withResolvers<LintResult[]>();
    const child = spawn(
        'bunx',
        [
            'eslint',
            '--format',
            'json',
            '--no-error-on-unmatched-pattern',
            '--cache',
            '--cache-location',
            `.nx-cache/eslint/${index}`,
            ...existingPaths,
        ],
        {
            env: {
                ...process.env,
                NODE_OPTIONS: '--max-old-space-size=4096',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        }
    );
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
        stdout += chunk;
    });
    child.stderr.on('data', chunk => {
        stderr += chunk;
    });
    child.once('error', reject);
    child.once('exit', code => {
        if (code !== 0 && !stdout.trim()) {
            reject(new Error(`ESLint cohort ${index + 1} failed without JSON output:\n${stderr}`));
            return;
        }

        try {
            const parsed: unknown = JSON.parse(stdout || '[]');
            resolve(lintResultsSchema.parse(parsed));
        } catch (error) {
            reject(error);
        }
    });

    return promise;
};

const lintResults: LintResult[] = [];

for (let index = 0; index < cohorts.length; index += concurrency) {
    const results = await Promise.all(
        cohorts
            .slice(index, index + concurrency)
            .map((paths, offset) => runCohort(paths, index + offset))
    );

    lintResults.push(...results.flat());
}

const currentErrors: Baseline = {};
const currentDescriptions: Record<string, Record<string, string>> = {};

for (const result of lintResults) {
    const path = relative(process.cwd(), result.filePath);
    const sourceLines = readFileSync(result.filePath, 'utf8').split(/\r?\n/);

    for (const message of result.messages) {
        if (message.severity !== 2) continue;

        const sourceLine = sourceLines[message.line - 1]?.trim() ?? '';
        const portableMessage = message.message
            .split(process.cwd())
            .join(REPOSITORY_PATH_PLACEHOLDER);
        const description = `${message.ruleId ?? 'fatal'}: ${portableMessage} | ${sourceLine}`;
        const fingerprint = createHash('sha256').update(description).digest('hex');
        const fileErrors = (currentErrors[path] ??= {});
        const fileDescriptions = (currentDescriptions[path] ??= {});
        fileErrors[fingerprint] = (fileErrors[fingerprint] ?? 0) + 1;
        fileDescriptions[fingerprint] = description;
    }
}

if (process.argv.includes('--update-baseline')) {
    const sorted = Object.fromEntries(
        Object.entries(currentErrors)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([path, errors]) => [
                path,
                Object.fromEntries(
                    Object.entries(errors).sort(([left], [right]) => left.localeCompare(right))
                ),
            ])
    );

    writeFileSync(BASELINE_PATH, `${JSON.stringify(sorted, null, 4)}\n`);
    console.log(`Updated ${BASELINE_PATH}`);
    process.exit(0);
}

const baseline = baselineSchema.parse(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')));
const newErrors: string[] = [];
let knownErrorCount = 0;

for (const [path, errors] of Object.entries(currentErrors)) {
    for (const [fingerprint, count] of Object.entries(errors)) {
        const allowed = baseline[path]?.[fingerprint] ?? 0;
        knownErrorCount += Math.min(count, allowed);

        if (count > allowed) {
            const description = currentDescriptions[path]?.[fingerprint] ?? fingerprint;
            newErrors.push(`${path}\n  ${description}\n  new occurrences: ${count - allowed}`);
        }
    }
}

if (newErrors.length) {
    console.error(
        `ESLint found errors outside the explicit legacy baseline:\n\n${newErrors.join('\n\n')}`
    );
    process.exit(1);
}

for (const [path, reason] of Object.entries(LEGACY_LINT_EXCEPTIONS)) {
    console.log(`ESLint legacy exception: ${path} — ${reason}`);
}
console.log(`ESLint passed (${knownErrorCount} explicit legacy errors remain baselined).`);
