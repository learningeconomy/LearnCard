import { z } from 'zod/v4';
import {
    CapabilityEnum,
    ManifestSemverValidator,
    ManifestSignatureValidator,
} from './education-os';

const text = z
    .string()
    .min(1)
    .max(4096)
    .refine((value): boolean => value.trim().length > 0);
const hasOwn = (value: object, key: string): boolean =>
    Object.prototype.hasOwnProperty.call(value, key);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/);
const configPath = z
    .string()
    .max(512)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/);
const platform = z.enum(['linux/amd64', 'linux/arm64']);
const relativePath = z
    .string()
    .max(2048)
    .regex(/^\/(?!\/)[^?#\\\s]*$/);
const literal = z
    .string()
    .max(4096)
    .refine((value): boolean => !/\$\{|\{\{|<%/.test(value), {
        message: 'Template expressions are not supported.',
    });
const timing = {
    timeoutMs: z.number().int().min(1).max(60_000),
    intervalMs: z.number().int().min(100).max(300_000),
    startupDeadlineMs: z.number().int().min(1).max(900_000),
};

export const WorkloadHealthcheckValidator = z.discriminatedUnion('kind', [
    z
        .object({
            kind: z.literal('http'),
            port: id,
            path: relativePath,
            expectStatus: z.number().int().min(100).max(599).optional(),
            ...timing,
        })
        .strict(),
    z.object({ kind: z.literal('tcp'), port: id, ...timing }).strict(),
    z.object({ kind: z.literal('exec'), argv: z.array(text).min(1).max(64), ...timing }).strict(),
]);
export type WorkloadHealthcheck = z.infer<typeof WorkloadHealthcheckValidator>;

export const WorkloadResourcesValidator = z
    .object({
        cpuMillis: z.number().int().min(1).max(256_000),
        memoryMiB: z.number().int().min(16).max(1_048_576),
        pids: z.number().int().min(1).max(65_536),
    })
    .strict();
export type WorkloadResources = z.infer<typeof WorkloadResourcesValidator>;

export const WorkloadEnvSourceValidator = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('config'), path: configPath }).strict(),
    z.object({ kind: z.literal('secret'), name: id }).strict(),
    z
        .object({
            kind: z.literal('endpoint'),
            endpointId: id,
            part: z.enum(['url', 'host', 'port', 'hostport']),
        })
        .strict(),
    z.object({ kind: z.literal('literal'), value: literal }).strict(),
]);
export type WorkloadEnvSource = z.infer<typeof WorkloadEnvSourceValidator>;

export const WorkloadComponentValidator = z
    .object({
        id,
        image: z
            .string()
            .max(512)
            .regex(
                /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]+(?::[0-9]{1,5})?\/(?:[a-z0-9]+(?:[._-][a-z0-9]+)*\/)*[a-z0-9]+(?:[._-][a-z0-9]+)*@sha256:[a-fA-F0-9]{64}$/,
                'Images must use a fully qualified registry/repository@sha256 digest.'
            ),
        platform,
        user: z
            .string()
            .regex(/^\d{1,10}(:\d{1,10})?$/)
            .refine((value): boolean => Number(value.split(':')[0]) > 0, 'Root user is forbidden.')
            .optional(),
        tmpfs: z
            .array(
                z
                    .object({
                        path: relativePath.refine((value): boolean => !/[:,\0]/.test(value)),
                        sizeMiB: z.number().int().min(1).max(1024),
                    })
                    .strict()
            )
            .max(16)
            .optional(),
        ports: z
            .array(
                z
                    .object({
                        name: id,
                        containerPort: z.number().int().min(1).max(65535),
                        protocol: z.enum(['tcp', 'udp']),
                    })
                    .strict()
            )
            .max(128),
        healthcheck: WorkloadHealthcheckValidator,
        dependsOn: z.array(id).max(256),
        resources: WorkloadResourcesValidator,
        volumes: z
            .array(
                z.object({ name: id, mountPath: relativePath, persistent: z.boolean() }).strict()
            )
            .max(128),
        env: z
            .array(
                z
                    .object({
                        name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,127}$/),
                        source: WorkloadEnvSourceValidator,
                    })
                    .strict()
            )
            .max(256),
    })
    .strict();
export type WorkloadComponent = z.infer<typeof WorkloadComponentValidator>;

export const WorkloadProfileValidator = z
    .object({
        id,
        kind: z.enum(['core', 'conditional', 'optional']),
        components: z.array(id).min(1).max(256),
        requiresProfiles: z.array(id).max(128),
        condition: z
            .object({
                configPath,
                equals: z.union([z.string().max(1024), z.number().finite(), z.boolean()]),
            })
            .strict()
            .optional(),
    })
    .strict();
export type WorkloadProfile = z.infer<typeof WorkloadProfileValidator>;

/** Safe pattern subset: classes, literals and anchors, with at most one quantifier.
 * No groups, alternatives or backreferences (which could cause backtracking DoS).
 */
const isSafeConfigPattern = (pattern: string): boolean => {
    if (/\\[1-9]|\\k/.test(pattern)) return false;
    const tokens = pattern.replace(/\[(?:\\.|[^\]\\])*\]/g, 'x').replace(/\\./g, 'x');
    if (/[()|]/.test(tokens)) return false;
    const quantifiers = tokens.match(/[+*?]|\{\d+(?:,\d+)?\}/g) ?? [];
    if (quantifiers.length > 1) return false;
    if (/[{}]/.test(tokens.replace(/\{\d+(?:,\d+)?\}/g, ''))) return false;
    if (
        quantifiers.some((quantifier): boolean =>
            (quantifier.match(/\d+/g) ?? []).some((count): boolean => Number(count) > 4096)
        )
    )
        return false;
    try {
        new RegExp(pattern);
        return true;
    } catch {
        return false;
    }
};

const stringSchema = z
    .object({
        type: z.literal('string'),
        enum: z.array(z.string().max(4096)).min(1).max(256).optional(),
        minLength: z.number().int().min(0).max(4096).optional(),
        maxLength: z.number().int().min(0).max(4096).optional(),
        pattern: z
            .string()
            .max(256)
            .refine(isSafeConfigPattern, 'Pattern must use the safe workload subset.')
            .optional(),
    })
    .strict();
const numberSchema = z
    .object({
        type: z.enum(['number', 'integer']),
        enum: z.array(z.number().finite()).min(1).max(256).optional(),
        minimum: z.number().finite().optional(),
        maximum: z.number().finite().optional(),
    })
    .strict();
const booleanSchema = z
    .object({ type: z.literal('boolean'), enum: z.array(z.boolean()).min(1).max(2).optional() })
    .strict();
const scalarSchema = z.union([stringSchema, numberSchema, booleanSchema]);
const arraySchema = z
    .object({
        type: z.literal('array'),
        items: scalarSchema,
        minItems: z.number().int().min(0).max(1024).optional(),
        maxItems: z.number().int().min(0).max(1024),
    })
    .strict();

/** Closed JSON-schema subset: objects, scalars and bounded homogeneous scalar arrays. */
const configObjectSchema = z
    .object({
        type: z.literal('object'),
        get properties(): z.ZodRecord<
            z.ZodString,
            z.ZodUnion<
                [typeof scalarSchema, typeof arraySchema, z.ZodLazy<typeof configObjectSchema>]
            >
        > {
            return z.record(
                id,
                z.union([
                    scalarSchema,
                    arraySchema,
                    z.lazy((): typeof configObjectSchema => configObjectSchema),
                ])
            );
        },
        required: z.array(id).max(256),
        additionalProperties: z.literal(false),
    })
    .strict()
    .superRefine((schema, ctx): void => {
        if (Object.keys(schema.properties).length > 256)
            ctx.addIssue({ code: 'custom', message: 'At most 256 properties per object.' });
        for (const key of schema.required) {
            if (!hasOwn(schema.properties, key))
                ctx.addIssue({
                    code: 'custom',
                    path: ['required'],
                    message: `Required property ${key} is not declared.`,
                });
        }
    });

/** Bound raw traversal before invoking the recursive parser (including cyclic JS input). */
export const WorkloadConfigSchemaValidator = z
    .unknown()
    .superRefine((input, ctx): void => {
        const pending: { value: unknown; depth: number }[] = [{ value: input, depth: 0 }];
        const seen = new Set<object>();
        let count = 0;
        while (pending.length) {
            const entry = pending.pop()!;
            if (++count > 8192 || entry.depth > 32) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Config schema exceeds depth or node budget.',
                });
                return;
            }
            if (entry.value && typeof entry.value === 'object') {
                if (seen.has(entry.value)) {
                    ctx.addIssue({
                        code: 'custom',
                        message: 'Config schema must be an acyclic JSON tree.',
                    });
                    return;
                }
                seen.add(entry.value);
                const values = Object.values(entry.value);
                if (values.length > 1024) {
                    ctx.addIssue({
                        code: 'custom',
                        message: 'Config schema collection is too large.',
                    });
                    return;
                }
                for (const value of values) pending.push({ value, depth: entry.depth + 1 });
            }
        }
    })
    .pipe(configObjectSchema);
export type WorkloadConfigSchema = z.infer<typeof WorkloadConfigSchemaValidator>;
type ConfigProperty = WorkloadConfigSchema['properties'][string];
export type WorkloadConfigValidationResult = { ok: true } | { ok: false; errors: string[] };

/** Validate without coercion, defaults, remote resolution, or executing config content. */
export const validateWorkloadConfig = (
    schema: unknown,
    config: unknown
): WorkloadConfigValidationResult => {
    const parsed = WorkloadConfigSchemaValidator.safeParse(schema);
    if (!parsed.success)
        return {
            ok: false,
            errors: parsed.error.issues.map(
                (issue): string => `${issue.path.join('.')}: ${issue.message}`
            ),
        };
    const errors: string[] = [];
    const visit = (node: ConfigProperty, value: unknown, path: string): void => {
        const fail = (message: string): void => {
            errors.push(`${path}: ${message}`);
        };
        if (node.type === 'object') {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                fail('Expected object');
                return;
            }
            const record = value as Record<string, unknown>;
            for (const key of node.required) if (!hasOwn(record, key)) fail(`Missing ${key}`);
            const keys = Object.keys(record);
            if (keys.length > 256) {
                fail('Too many object properties');
                return;
            }
            for (const key of keys) {
                if (!hasOwn(node.properties, key)) fail(`Unknown property ${key}`);
                else visit(node.properties[key]!, record[key], `${path}.${key}`);
            }
            return;
        }
        if (node.type === 'array') {
            if (!Array.isArray(value)) {
                fail('Expected array');
                return;
            }
            if (value.length > node.maxItems || value.length < (node.minItems ?? 0)) {
                fail('Array length out of bounds');
                return;
            }
            value.forEach((item: unknown, index): void =>
                visit(node.items, item, `${path}[${index}]`)
            );
            return;
        }
        if (node.type === 'string') {
            if (typeof value !== 'string') {
                fail('Expected string');
                return;
            }
            if (value.length < (node.minLength ?? 0) || value.length > (node.maxLength ?? 4096)) {
                fail('String length out of bounds');
                return;
            }
            if (node.pattern && !new RegExp(node.pattern).test(value)) fail('Pattern mismatch');
        } else if (node.type === 'boolean') {
            if (typeof value !== 'boolean') {
                fail('Expected boolean');
                return;
            }
        } else {
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                fail('Expected finite number');
                return;
            }
            if (node.type === 'integer' && !Number.isInteger(value)) fail('Expected integer');
            if (value < (node.minimum ?? -Infinity) || value > (node.maximum ?? Infinity))
                fail('Number out of bounds');
        }
        if (node.enum && !node.enum.some((entry): boolean => entry === value))
            fail('Value not in enum');
    };
    visit(parsed.data, config, '$');
    return errors.length ? { ok: false, errors } : { ok: true };
};

export const WorkloadSecretDeclarationValidator = z
    .object({
        name: id,
        purpose: text,
        consumers: z.array(id).min(1).max(256),
        required: z.boolean(),
        provisioning: z.discriminatedUnion('kind', [
            z
                .object({
                    kind: z.literal('generate'),
                    format: z.enum(['token', 'ed25519-seed', 'ed25519-seed-multibase', 'password']),
                    bytes: z.number().int().min(16).max(256).optional(),
                })
                .strict(),
            z.object({ kind: z.literal('existing-reference') }).strict(),
        ]),
    })
    .strict();
export type WorkloadSecretDeclaration = z.infer<typeof WorkloadSecretDeclarationValidator>;

export const WorkloadEndpointDeclarationValidator = z
    .object({
        id,
        component: id,
        port: id,
        path: relativePath,
        protocol: z.enum(['http', 'https', 'tcp']),
        visibility: z.enum(['internal', 'ecosystem', 'public']),
        auth: z.enum(['none', 'tenant-token', 'mtls']),
        capability: CapabilityEnum.optional(),
        purpose: text,
        preserveOnRetirement: z.boolean(),
    })
    .strict();
export type WorkloadEndpointDeclaration = z.infer<typeof WorkloadEndpointDeclarationValidator>;

export const WorkloadCapabilityDeclarationValidator = z
    .object({
        capability: CapabilityEnum,
        profiles: z.array(id).min(1).max(128),
    })
    .strict();
export type WorkloadCapabilityDeclaration = z.infer<typeof WorkloadCapabilityDeclarationValidator>;

// Owners require a team/contact, not the bare organization acronym LEF (case-insensitive).
const owner = text.refine((value): boolean => !/^LEF[\s\W]*$/i.test(value.trim()), {
    message: 'Specify an accountable team/contact, not bare LEF.',
});
export const WorkloadSupportBoundaryValidator = z
    .object({
        patchOwner: owner,
        pageOwner: owner,
        slo: text,
        upgradePolicy: text,
        backup: text,
        retirementPlan: text,
    })
    .strict();
export type WorkloadSupportBoundary = z.infer<typeof WorkloadSupportBoundaryValidator>;

const workloadPackage = z
    .object({
        apiVersion: z.literal('lc.workload/v1'),
        id,
        version: ManifestSemverValidator,
        publisherDid: z.string().startsWith('did:').min(5),
        upstream: z
            .array(
                z
                    .object({ name: text, repository: z.string().url(), license: text, ref: text })
                    .strict()
            )
            .min(1),
        artifacts: z
            .object({
                module: z
                    .object({
                        kind: z.literal('compose'),
                        ref: z
                            .object({
                                uri: z.string().url(),
                                sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
                            })
                            .strict(),
                        rendererVersion: ManifestSemverValidator,
                    })
                    .strict(),
            })
            .strict(),
        components: z.array(WorkloadComponentValidator).min(1).max(256),
        profiles: z.array(WorkloadProfileValidator).min(1).max(128),
        configSchema: WorkloadConfigSchemaValidator,
        secretRefs: z.array(WorkloadSecretDeclarationValidator).max(256),
        provides: z.array(WorkloadCapabilityDeclarationValidator),
        consumes: z.array(WorkloadCapabilityDeclarationValidator),
        endpoints: z.array(WorkloadEndpointDeclarationValidator).max(256),
        targets: z
            .array(
                z
                    .object({
                        driver: z.enum(['local-compose', 'ecs', 'kubernetes', 'customer-cloud']),
                        platforms: z.array(platform).min(1),
                    })
                    .strict()
            )
            .min(1),
        sizing: z
            .array(
                z
                    .object({
                        id,
                        profiles: z.array(id).min(1),
                        resources: WorkloadResourcesValidator,
                    })
                    .strict()
            )
            .min(1),
        supportBoundary: WorkloadSupportBoundaryValidator,
        signature: ManifestSignatureValidator.strict(),
    })
    .strict();

/** Resolve declared references and reject cycles; this is not a profile-selection solver. */
export const validateWorkloadReferences = (
    manifest: z.infer<typeof workloadPackage>,
    ctx: z.core.$RefinementCtx
): void => {
    const issue = (path: (string | number)[], message: string): void => {
        ctx.addIssue({ code: 'custom', path, message });
    };
    const unique = (values: string[], path: (string | number)[]): Set<string> => {
        const result = new Set<string>();
        values.forEach((value, index): void => {
            if (result.has(value)) issue([...path, index], `Duplicate identifier ${value}`);
            result.add(value);
        });
        return result;
    };
    const components = unique(
        manifest.components.map((entry): string => entry.id),
        ['components']
    );
    const profiles = unique(
        manifest.profiles.map((entry): string => entry.id),
        ['profiles']
    );
    const endpoints = unique(
        manifest.endpoints.map((entry): string => entry.id),
        ['endpoints']
    );
    const secrets = unique(
        manifest.secretRefs.map((entry): string => entry.name),
        ['secretRefs']
    );
    const resolve = (values: string[], ids: Set<string>, path: (string | number)[]): void => {
        values.forEach((value, index): void => {
            if (!ids.has(value)) issue([...path, index], `Unresolved reference ${value}`);
        });
    };
    const configExists = (path: string): boolean => {
        let node: ConfigProperty = manifest.configSchema;
        for (const part of path.split('.')) {
            if (node.type !== 'object' || !hasOwn(node.properties, part)) return false;
            node = node.properties[part]!;
        }
        return true;
    };
    manifest.components.forEach((component, index): void => {
        const ports = unique(
            component.ports.map((port): string => port.name),
            ['components', index, 'ports']
        );
        unique(
            component.env.map((env): string => env.name),
            ['components', index, 'env']
        );
        unique(
            component.volumes.map((volume): string => volume.name),
            ['components', index, 'volumes']
        );
        resolve(component.dependsOn, components, ['components', index, 'dependsOn']);
        if (component.healthcheck.kind !== 'exec')
            resolve([component.healthcheck.port], ports, [
                'components',
                index,
                'healthcheck',
                'port',
            ]);
        component.env.forEach(({ source }, envIndex): void => {
            const path = ['components', index, 'env', envIndex, 'source'];
            if (source.kind === 'secret') {
                resolve([source.name], secrets, path);
                const secret = manifest.secretRefs.find(
                    (entry): boolean => entry.name === source.name
                );
                if (secret && !secret.consumers.includes(component.id))
                    issue(path, 'Component is not a declared secret consumer');
            }
            if (source.kind === 'endpoint') resolve([source.endpointId], endpoints, path);
            if (source.kind === 'config' && !configExists(source.path))
                issue(path, 'Unknown config path');
        });
    });
    manifest.profiles.forEach((profile, index): void => {
        resolve(profile.components, components, ['profiles', index, 'components']);
        resolve(profile.requiresProfiles, profiles, ['profiles', index, 'requiresProfiles']);
        if (profile.condition && !configExists(profile.condition.configPath))
            issue(['profiles', index, 'condition'], 'Unknown config path');
    });
    if (manifest.profiles.filter((profile): boolean => profile.kind === 'core').length !== 1)
        issue(['profiles'], 'Exactly one core profile is required');
    manifest.endpoints.forEach((endpoint, index): void => {
        resolve([endpoint.component], components, ['endpoints', index, 'component']);
        const component = manifest.components.find(
            (entry): boolean => entry.id === endpoint.component
        );
        resolve([endpoint.port], new Set(component?.ports.map((port): string => port.name)), [
            'endpoints',
            index,
            'port',
        ]);
    });
    manifest.secretRefs.forEach((secret, index): void =>
        resolve(secret.consumers, components, ['secretRefs', index, 'consumers'])
    );
    for (const key of ['provides', 'consumes', 'sizing'] as const)
        manifest[key].forEach((entry, index): void =>
            resolve(entry.profiles, profiles, [key, index, 'profiles'])
        );
    const acyclic = (graph: Map<string, string[]>, path: string[]): void => {
        const active = new Set<string>();
        const done = new Set<string>();
        const visit = (key: string): void => {
            if (active.has(key)) {
                issue(path, `Dependency cycle at ${key}`);
                return;
            }
            if (done.has(key)) return;
            active.add(key);
            for (const dependency of graph.get(key) ?? []) visit(dependency);
            active.delete(key);
            done.add(key);
        };
        for (const key of graph.keys()) visit(key);
    };
    acyclic(
        new Map(
            manifest.components.map((entry): [string, string[]] => [entry.id, entry.dependsOn])
        ),
        ['components']
    );
    acyclic(
        new Map(
            manifest.profiles.map((entry): [string, string[]] => [entry.id, entry.requiresProfiles])
        ),
        ['profiles']
    );
};

export const WorkloadPackageValidator = workloadPackage.superRefine(validateWorkloadReferences);
export type WorkloadPackage = z.infer<typeof WorkloadPackageValidator>;
