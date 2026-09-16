import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import ts from 'typescript';
import type { z } from 'zod';

const EXAMPLE_PATHS = [
    'apps/learn-card-app/.env.example',
    'apps/scouts/.env.example',
    'services/learn-card-network/brain-service/.env.example',
    'services/learn-card-network/lca-api/.env.example',
    'services/learn-card-network/learn-cloud-service/.env.example',
] as const;

export const parseEnvironmentExample = (path: string): Record<string, string> => {
    const values: Record<string, string> = {};

    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
        const match = /^\s*([A-Z][A-Z0-9_]*)\s*=(.*)$/.exec(line);

        if (match) values[match[1]] = match[2];
    }

    return values;
};

// Service environment modules validate on import. Seed this verifier process with the
// documented examples first so importing their schemas is deterministic and side-effect safe.
for (const path of EXAMPLE_PATHS.slice(2)) {
    Object.assign(process.env, parseEnvironmentExample(path));
}

const [learnCardApp, scouts, brainService, lcaApi, learnCloudService] = await Promise.all([
    import('../apps/learn-card-app/src/config/buildEnvironment'),
    import('../apps/scouts/src/config/buildEnvironment'),
    import('../services/learn-card-network/brain-service/src/config/environment'),
    import('../services/learn-card-network/lca-api/src/config/environment'),
    import('../services/learn-card-network/learn-cloud-service/src/config/environment'),
]);

export type EnvironmentContract = {
    project: string;
    examplePath: string;
    schema: z.ZodType;
    shape: z.ZodRawShape;
    injectedValues?: Record<string, string>;
    unmanagedKeys?: readonly string[];
};

export const environmentContracts: readonly EnvironmentContract[] = [
    {
        project: 'learn-card-app',
        examplePath: EXAMPLE_PATHS[0],
        schema: learnCardApp.learnCardAppEnvironmentSchema,
        shape: learnCardApp.learnCardAppEnvironmentShape,
        injectedValues: { MODE: 'development' },
        unmanagedKeys: [
            'MODE',
            'GITHUB_SHA',
            'HEROKU_SLUG_COMMIT',
            'VERCEL_GIT_COMMIT_SHA',
            'BUILD_SHA',
        ],
    },
    {
        project: 'scouts',
        examplePath: EXAMPLE_PATHS[1],
        schema: scouts.scoutsEnvironmentSchema,
        shape: scouts.scoutsEnvironmentShape,
        injectedValues: {
            MODE: 'development',
            VITE_WEB3AUTH_CLIENT_ID: 'example-client-id',
        },
        unmanagedKeys: [
            'MODE',
            'GITHUB_SHA',
            'HEROKU_SLUG_COMMIT',
            'VERCEL_GIT_COMMIT_SHA',
            'BUILD_SHA',
        ],
    },
    {
        project: 'brain-service',
        examplePath: EXAMPLE_PATHS[2],
        schema: brainService.brainServiceEnvironmentSchema,
        shape: brainService.brainServiceEnvironmentShape,
    },
    {
        project: 'lca-api',
        examplePath: EXAMPLE_PATHS[3],
        schema: lcaApi.lcaApiEnvironmentSchema,
        shape: lcaApi.lcaApiEnvironmentShape,
    },
    {
        project: 'learn-cloud-service',
        examplePath: EXAMPLE_PATHS[4],
        schema: learnCloudService.learnCloudServiceEnvironmentSchema,
        shape: learnCloudService.learnCloudServiceEnvironmentShape,
    },
];

const SOURCE_ROOTS = [
    'apps/learn-card-app/src',
    'apps/scouts/src',
    'packages/learn-card-base/src',
    'services/learn-card-network/brain-service/src',
    'services/learn-card-network/lca-api/src',
    'services/learn-card-network/learn-cloud-service/src',
] as const;

const ENVIRONMENT_ENTRYPOINTS = [
    'services/learn-card-network/brain-service/lambda.ts',
    'services/learn-card-network/brain-service/didWebLambda.ts',
    'services/learn-card-network/lca-api/lambda.ts',
    'services/learn-card-network/learn-cloud-service/lambda.ts',
    'services/learn-card-network/learn-cloud-service/didWebLambda.ts',
    'services/learn-card-network/learn-cloud-service/oidcLambda.ts',
    'services/learn-card-network/learn-cloud-service/xApiLambda.ts',
] as const;

const ALLOWED_ENVIRONMENT_MODULES: Record<string, true> = {
    'services/learn-card-network/brain-service/src/config/environment.ts': true,
    'services/learn-card-network/lca-api/src/config/environment.ts': true,
    'services/learn-card-network/learn-cloud-service/src/config/environment.ts': true,
};

const walkSourceFiles = (root: string): string[] => {
    if (!existsSync(root)) return [];

    const files: string[] = [];

    for (const entry of readdirSync(root)) {
        const path = join(root, entry);
        const stats = statSync(path);

        if (stats.isDirectory()) {
            if (['build', 'dist', 'node_modules', 'swagger-ui'].includes(entry)) continue;
            files.push(...walkSourceFiles(path));
            continue;
        }

        if (!['.ts', '.tsx', '.mts'].includes(extname(entry))) continue;
        if (/\.(?:test|spec)\./.test(entry)) continue;

        files.push(path);
    }

    return files;
};

const isProcessEnv = (node: ts.Node): boolean =>
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'process' &&
    node.name.text === 'env';

const isImportMetaEnv = (node: ts.Node): boolean =>
    ts.isPropertyAccessExpression(node) &&
    ts.isMetaProperty(node.expression) &&
    node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
    node.name.text === 'env';

export const findDirectEnvironmentReads = (): string[] => {
    const errors: string[] = [];
    const sourceFiles = [
        ...SOURCE_ROOTS.flatMap(root => walkSourceFiles(root)),
        ...ENVIRONMENT_ENTRYPOINTS,
    ];

    for (const path of sourceFiles) {
        if (ALLOWED_ENVIRONMENT_MODULES[path]) continue;

        const source = readFileSync(path, 'utf8');
        const sourceFile = ts.createSourceFile(
            path,
            source,
            ts.ScriptTarget.Latest,
            true,
            path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );

        const visit = (node: ts.Node): void => {
            const readsProcessEnv =
                (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
                isProcessEnv(node.expression);
            const readsImportMetaEnv =
                (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
                isImportMetaEnv(node.expression);

            if (readsProcessEnv || readsImportMetaEnv) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                    node.getStart(sourceFile)
                );
                errors.push(
                    `${path}:${line + 1}:${character + 1} reads environment outside its config module`
                );
                return;
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
    }

    return errors;
};

export const validateEnvironmentExamples = (): string[] => {
    const errors: string[] = [];

    for (const contract of environmentContracts) {
        const values = parseEnvironmentExample(contract.examplePath);
        const schemaKeys = Object.keys(contract.shape);
        const managedSchemaKeys = schemaKeys.filter(key => !contract.unmanagedKeys?.includes(key));
        const exampleKeys = Object.keys(values);

        for (const key of managedSchemaKeys) {
            if (!(key in values)) {
                errors.push(`${contract.examplePath} does not document ${key}`);
            }
        }

        for (const key of exampleKeys) {
            if (!schemaKeys.includes(key)) {
                errors.push(`${contract.examplePath} documents unknown key ${key}`);
            }
        }

        const result = contract.schema.safeParse({ ...values, ...contract.injectedValues });

        if (!result.success) {
            for (const issue of result.error.issues) {
                errors.push(
                    `${contract.examplePath} ${issue.path.map(String).join('.') || '(environment)'}: ${issue.message}`
                );
            }
        }
    }

    errors.push(...findDirectEnvironmentReads());

    return errors;
};
