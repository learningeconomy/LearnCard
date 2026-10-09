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
// The shared verifier process must use the offline provider while importing service schemas.
// Individual contracts below are still validated using their own example values.
const verifierOfflineSetting = process.env.IS_OFFLINE;
process.env.IS_OFFLINE = 'true';

const [learnCardApp, scouts, brainService, lcaApi, learnCloudService] = await Promise.all([
    import('../apps/learn-card-app/src/config/buildEnvironment'),
    import('../apps/scouts/src/config/buildEnvironment'),
    import('../services/learn-card-network/brain-service/src/config/environment'),
    import('../services/learn-card-network/lca-api/src/config/environment'),
    import('../services/learn-card-network/learn-cloud-service/src/config/environment'),
]);
if (verifierOfflineSetting === undefined) delete process.env.IS_OFFLINE;
else process.env.IS_OFFLINE = verifierOfflineSetting;

export type EnvironmentContract = {
    project: string;
    examplePath: string;
    schema: z.ZodType;
    shape: z.ZodRawShape;
    injectedValues?: Record<string, string>;
    unmanagedKeys?: readonly string[];
    // Deploy/runtime bootstrap controls (stage selection, secrets bundle id) read before the
    // validating config module loads. Not in the schema; allowed in the example, never relaxes
    // validation of a schema-managed value.
    bootstrapKeys?: readonly string[];
    // Checked-in per-stage config files (config/config*.json). Keys declared there are non-secret
    // defaults/stage settings dedicated helpers read straight from process.env; the example may
    // document them only if a stage file actually declares them, so typo'd keys still fail.
    stageConfigPaths?: readonly string[];
};

const BRAIN_CONFIG_PATHS = [
    'services/learn-card-network/brain-service/config/config.json',
    'services/learn-card-network/brain-service/config/config.dev.json',
    'services/learn-card-network/brain-service/config/config.production.json',
] as const;

const LEARN_CLOUD_CONFIG_PATHS = [
    'services/learn-card-network/learn-cloud-service/config/config.json',
    'services/learn-card-network/learn-cloud-service/config/config.dev.json',
    'services/learn-card-network/learn-cloud-service/config/config.production.json',
] as const;

// Stage selection and the runtime secrets bundle id are resolved by the thin Lambda/Docker
// bootstrap entrypoints before the validating config module is imported. The lca-api reference
// contract keeps these inside its schema (see lcaApiEnvironmentShape); the brain/cloud services
// adopted the extracted service-config model, so they declare them here instead.
const SERVICE_BOOTSTRAP_KEYS = [
    'CONFIG_STAGE',
    'LAMBDA_STAGE',
    'RUNTIME_SECRETS_ID',
    'AWS_LAMBDA_FUNCTION_NAME',
] as const;

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
        bootstrapKeys: SERVICE_BOOTSTRAP_KEYS,
        stageConfigPaths: BRAIN_CONFIG_PATHS,
        unmanagedKeys: [
            'MONGO_URI',
            'MONGO_DB_NAME',
            'DEMO_PERSONA_SIGNING_AUTHORITY_ENDPOINT',
            'DEMO_PERSONA_SA_SEED',
            // Optional owner-API namespace override read straight from process.env by
            // share-link-owner/config.ts; defaults to SHARE_LINK_MAINTENANCE_NAMESPACE, so it is
            // intentionally not seeded into the stage config files.
            'SHARE_LINK_OWNER_API_NAMESPACE',
        ],
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
        bootstrapKeys: SERVICE_BOOTSTRAP_KEYS,
        stageConfigPaths: LEARN_CLOUD_CONFIG_PATHS,
        // xAPI credentials and the JWT signing key are forwarded to the Lambda by
        // serverless.function-env.cjs, not parsed by the service schema.
        unmanagedKeys: ['XAPI_USERNAME', 'XAPI_PASSWORD', 'JWT_SIGNING_KEY'],
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
    'services/learn-card-network/brain-service/lambdaApp.ts',
    'services/learn-card-network/brain-service/didWebLambda.ts',
    'services/learn-card-network/brain-service/didWebLambdaApp.ts',
    'services/learn-card-network/brain-service/contractEventsLambda.ts',
    'services/learn-card-network/brain-service/contractEventsLambdaApp.ts',
    'services/learn-card-network/brain-service/shareLinkMaintenanceLambda.ts',
    'services/learn-card-network/brain-service/shareLinkMaintenanceLambdaApp.ts',
    'services/learn-card-network/lca-api/lambda.ts',
    'services/learn-card-network/lca-api/lambdaApp.ts',
    'services/learn-card-network/lca-api/oidcLambda.ts',
    'services/learn-card-network/lca-api/oidcLambdaApp.ts',
    'services/learn-card-network/lca-api/seedMigrationLambda.ts',
    'services/learn-card-network/lca-api/seedMigrationApp.ts',
    'services/learn-card-network/learn-cloud-service/lambda.ts',
    'services/learn-card-network/learn-cloud-service/lambdaApp.ts',
    'services/learn-card-network/learn-cloud-service/didWebLambda.ts',
    'services/learn-card-network/learn-cloud-service/didWebLambdaApp.ts',
    'services/learn-card-network/learn-cloud-service/oidcLambda.ts',
    'services/learn-card-network/learn-cloud-service/oidcLambdaApp.ts',
    'services/learn-card-network/learn-cloud-service/xApiLambda.ts',
    'services/learn-card-network/learn-cloud-service/xApiLambdaApp.ts',
] as const;

const ALLOWED_ENVIRONMENT_MODULES: Record<string, true> = {
    'services/learn-card-network/brain-service/src/config/environment.ts': true,
    'services/learn-card-network/lca-api/src/config/environment.ts': true,
    'services/learn-card-network/lca-api/src/config/oidcEnvironment.ts': true,
    'services/learn-card-network/lca-api/src/config/cacheEnvironment.ts': true,
    // Stage bootstrap reads the deploy stage and applies checked-in config before the
    // validating environment module is imported. Each service keeps this in its stage
    // module plus the Lambda/Docker entrypoints that run before the app loads.
    'services/learn-card-network/lca-api/lambda.ts': true,
    'services/learn-card-network/lca-api/oidcLambda.ts': true,
    'services/learn-card-network/lca-api/seedMigrationLambda.ts': true,
    'services/learn-card-network/lca-api/src/config/applyDockerStageConfig.ts': true,
    'services/learn-card-network/brain-service/src/config/stageConfig.ts': true,
    'services/learn-card-network/brain-service/src/config/applyDockerStageConfig.ts': true,
    'services/learn-card-network/brain-service/lambda.ts': true,
    'services/learn-card-network/brain-service/didWebLambda.ts': true,
    'services/learn-card-network/brain-service/contractEventsLambda.ts': true,
    'services/learn-card-network/brain-service/shareLinkMaintenanceLambda.ts': true,
    'services/learn-card-network/learn-cloud-service/src/config/environment.ts': true,
    'services/learn-card-network/learn-cloud-service/src/config/stageConfig.ts': true,
    'services/learn-card-network/learn-cloud-service/src/config/applyDockerStageConfig.ts': true,
    'services/learn-card-network/learn-cloud-service/lambda.ts': true,
    'services/learn-card-network/learn-cloud-service/didWebLambda.ts': true,
    'services/learn-card-network/learn-cloud-service/oidcLambda.ts': true,
    'services/learn-card-network/learn-cloud-service/xApiLambda.ts': true,
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

const readStageConfig = (path: string): Record<string, string> => {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`${path} must contain a flat config object`);
    }
    return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => {
            if (typeof value !== 'string' || !/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(key)) {
                throw new Error(`${path} must contain environment names with string values`);
            }
            return [key, value];
        })
    );
};

export const loadStageConfigKeys = (paths: readonly string[] | undefined): Set<string> =>
    new Set((paths ?? []).flatMap(path => Object.keys(readStageConfig(path))));

// A field is required when its schema rejects an absent value: optional fields and fields with
// a default accept `undefined`. Only required fields must be documented in the example; optional
// non-secret defaults may be omitted.
const isRequiredSchemaKey = (shape: z.ZodRawShape, key: string): boolean => {
    const field = shape[key];

    return field ? !field.safeParse(undefined).success : false;
};

export const validateEnvironmentExamples = (
    contracts: readonly EnvironmentContract[] = environmentContracts
): string[] => {
    const errors: string[] = [];

    for (const contract of contracts) {
        const values = parseEnvironmentExample(contract.examplePath);
        const schemaKeys = Object.keys(contract.shape);
        const stageConfigKeys = loadStageConfigKeys(contract.stageConfigPaths);
        const exampleKeys = Object.keys(values);

        const isDocumentableNonSchemaKey = (key: string): boolean =>
            Boolean(contract.unmanagedKeys?.includes(key)) ||
            Boolean(contract.bootstrapKeys?.includes(key)) ||
            stageConfigKeys.has(key);

        for (const key of schemaKeys) {
            if (contract.unmanagedKeys?.includes(key)) continue;
            if (key in values) continue;
            if (
                contract.stageConfigPaths &&
                (stageConfigKeys.has(key) || !isRequiredSchemaKey(contract.shape, key))
            )
                continue;

            errors.push(`${contract.examplePath} does not document required ${key}`);
        }

        for (const key of exampleKeys) {
            if (schemaKeys.includes(key)) continue;
            if (isDocumentableNonSchemaKey(key)) continue;

            errors.push(`${contract.examplePath} documents unknown key ${key}`);
        }

        const result = contract.schema.safeParse({ ...values, ...contract.injectedValues });

        if (!result.success) {
            for (const issue of result.error.issues) {
                errors.push(
                    `${contract.examplePath} ${issue.path.map(String).join('.') || '(environment)'}: ${issue.message}`
                );
            }
        }

        // Validate the actual bundled values too, layered over example credentials. The
        // first path is the service base, followed by the dev and production overlays.
        const [basePath, ...stagePaths] = contract.stageConfigPaths ?? [];
        const base = basePath ? readStageConfig(basePath) : {};
        for (const stagePath of stagePaths) {
            const stageResult = contract.schema.safeParse({
                ...values,
                ...base,
                ...readStageConfig(stagePath),
                ...contract.injectedValues,
            });
            if (!stageResult.success) {
                for (const issue of stageResult.error.issues) {
                    errors.push(
                        `${stagePath} ${issue.path.map(String).join('.') || '(environment)'}: ${issue.message}`
                    );
                }
            }
        }
    }

    errors.push(...findDirectEnvironmentReads());

    return errors;
};
