import { z } from 'zod';

// Reviewed subset: https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html
const basicTypes: Record<string, true> = {
    object: true,
    array: true,
    string: true,
    integer: true,
    number: true,
    boolean: true,
    null: true,
};
const formats: Record<string, true> = {
    'date-time': true,
    time: true,
    date: true,
    duration: true,
    email: true,
    hostname: true,
    uri: true,
    ipv4: true,
    ipv6: true,
    uuid: true,
};
const keywords: Record<string, true> = {
    $schema: true,
    $defs: true,
    $def: true,
    definitions: true,
    $ref: true,
    type: true,
    properties: true,
    required: true,
    additionalProperties: true,
    items: true,
    minItems: true,
    enum: true,
    const: true,
    anyOf: true,
    allOf: true,
    format: true,
    title: true,
    description: true,
};
const representableZodTypes: Record<string, true> = {
    string: true,
    number: true,
    boolean: true,
    null: true,
    object: true,
    array: true,
    union: true,
    intersection: true,
    enum: true,
    literal: true,
    nullable: true,
    optional: true,
    nonoptional: true,
    pipe: true,
    readonly: true,
    lazy: true,
    transform: true,
};
const projectedZodChecks: Record<string, true> = {
    custom: true,
    less_than: true,
    greater_than: true,
    multiple_of: true,
    number_format: true,
    min_length: true,
    max_length: true,
    length_equals: true,
    string_format: true,
    overwrite: true,
};
const omittedProviderConstraints = [
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
    'minLength',
    'maxLength',
    'pattern',
    'maxItems',
] as const;

export class BedrockSchemaError extends Error {
    readonly code = 'unsupported_bedrock_schema';
    constructor(
        readonly path: string,
        readonly reason: string
    ) {
        super(`Unsupported Bedrock schema at ${path}: ${reason}`);
        this.name = 'BedrockSchemaError';
    }
}
function fail(path: string, reason: string): never {
    throw new BedrockSchemaError(path, reason);
}
const record = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const segment = (key: string): string => key.replace(/~/g, '~0').replace(/\//g, '~1');
const scalar = (value: unknown): boolean =>
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value));

/** Validates syntax and the reviewed nonrecursive Bedrock subset, before any egress. */
export function validateBedrockJsonSchema(schema: unknown): void {
    if (!record(schema)) fail('#', 'schema must be an object');
    const root = schema as Record<string, unknown>;
    const active = new Set<object>();
    const visited = new Set<object>();
    const resolve = (ref: unknown, path: string): Record<string, unknown> => {
        if (typeof ref !== 'string' || !ref.startsWith('#/'))
            fail(path, 'only internal JSON Pointer references are supported');
        let target: unknown = root;
        for (const part of (ref as string).slice(2).split('/')) {
            if (/~(?![01])/u.test(part)) fail(path, 'invalid JSON Pointer escape');
            const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
            if (!record(target) || !Object.hasOwn(target, key))
                fail(path, 'unresolved internal reference');
            target = (target as Record<string, unknown>)[key];
        }
        if (!record(target)) fail(path, 'reference target must be a schema object');
        return target as Record<string, unknown>;
    };
    const visit = (value: unknown, path: string): void => {
        if (!record(value)) fail(path, 'schema must be an object');
        const node = value as Record<string, unknown>;
        if (active.has(node)) fail(path, 'recursive schemas are not supported');
        if (visited.has(node)) return;
        active.add(node);
        for (const key of Object.keys(node)) {
            if (!Object.hasOwn(keywords, key))
                fail(`${path}/${segment(key)}`, 'keyword is not supported');
        }
        for (const key of ['$schema', 'title', 'description']) {
            if (key in node && typeof node[key] !== 'string')
                fail(`${path}/${key}`, 'metadata must be a string');
        }
        if ('$schema' in node && node.$schema !== 'https://json-schema.org/draft/2020-12/schema')
            fail(`${path}/$schema`, 'only Draft 2020-12 is supported');
        for (const key of ['$defs', '$def', 'definitions']) {
            if (!(key in node)) continue;
            if (!record(node[key])) fail(`${path}/${key}`, 'definitions must be an object');
            for (const [name, child] of Object.entries(node[key] as Record<string, unknown>))
                visit(child, `${path}/${key}/${segment(name)}`);
        }
        if ('$ref' in node) {
            if (
                Object.keys(node).some(
                    key =>
                        ![
                            '$ref',
                            '$schema',
                            '$defs',
                            '$def',
                            'definitions',
                            'description',
                            'title',
                        ].includes(key)
                )
            )
                fail(`${path}/$ref`, 'reference siblings cannot add constraints');
            visit(resolve(node.$ref, `${path}/$ref`), `${path}/$ref`);
        }
        const types = Array.isArray(node.type) ? node.type : 'type' in node ? [node.type] : [];
        if (
            'type' in node &&
            (!types.length ||
                types.some(type => typeof type !== 'string' || !Object.hasOwn(basicTypes, type)) ||
                new Set(types).size !== types.length)
        )
            fail(`${path}/type`, 'invalid basic type');
        if (!types.length && !['$ref', 'enum', 'const', 'anyOf', 'allOf'].some(key => key in node))
            fail(path, 'unconstrained schemas are not supported');
        if (
            'enum' in node &&
            (!Array.isArray(node.enum) ||
                !node.enum.length ||
                node.enum.some(item => !scalar(item)))
        )
            fail(`${path}/enum`, 'enum must contain scalar JSON values');
        if ('const' in node && !scalar(node.const))
            fail(`${path}/const`, 'const must be a scalar JSON value');
        if (
            'format' in node &&
            (!types.includes('string') ||
                typeof node.format !== 'string' ||
                !Object.hasOwn(formats, node.format))
        )
            fail(`${path}/format`, 'string format is not supported');
        if (types.includes('object')) {
            if (node.additionalProperties !== false)
                fail(`${path}/additionalProperties`, 'objects must reject additional properties');
            if (!record(node.properties))
                fail(`${path}/properties`, 'object properties must be an object');
            for (const [key, child] of Object.entries(node.properties as Record<string, unknown>))
                visit(child, `${path}/properties/${segment(key)}`);
            if (
                'required' in node &&
                (!Array.isArray(node.required) ||
                    new Set(node.required).size !== node.required.length ||
                    node.required.some(
                        key =>
                            typeof key !== 'string' ||
                            !Object.hasOwn(node.properties as object, key)
                    ))
            )
                fail(`${path}/required`, 'required must name distinct declared properties');
        } else if (['properties', 'required', 'additionalProperties'].some(key => key in node))
            fail(path, 'object keywords require object type');
        if (types.includes('array')) {
            visit(node.items, `${path}/items`);
            if ('minItems' in node && node.minItems !== 0 && node.minItems !== 1)
                fail(`${path}/minItems`, 'only minItems 0 or 1 is supported');
        } else if (['items', 'minItems'].some(key => key in node))
            fail(path, 'array keywords require array type');
        for (const key of ['anyOf', 'allOf']) {
            if (!(key in node)) continue;
            if (!Array.isArray(node[key]) || !(node[key] as unknown[]).length)
                fail(`${path}/${key}`, 'composition must contain schema branches');
            for (const [index, child] of (node[key] as unknown[]).entries()) {
                visit(child, `${path}/${key}/${index}`);
                // Bedrock documents allOf with limitations; only same-type scalar composition is reviewed.
                if (key === 'allOf') {
                    const branch =
                        record(child) && '$ref' in child
                            ? resolve(child.$ref, `${path}/${key}/${index}`)
                            : child;
                    if (
                        !record(branch) ||
                        typeof branch.type !== 'string' ||
                        ['object', 'array'].includes(branch.type)
                    )
                        fail(
                            `${path}/${key}/${index}`,
                            'allOf is limited to explicitly typed scalar branches'
                        );
                    const first = (node[key] as Record<string, unknown>[])[0]!;
                    const firstType =
                        '$ref' in first ? resolve(first.$ref, `${path}/${key}/0`).type : first.type;
                    if (branch.type !== firstType)
                        fail(
                            `${path}/${key}/${index}`,
                            'allOf branches must have the same scalar type'
                        );
                }
            }
        }
        active.delete(node);
        visited.add(node);
    };
    visit(root, '#');
}

// Inspect structural input domains before exporting. Nonportable refinements
// remain authoritative in the unchanged original Zod parser after decoding.
function inspectZod(schema: z.ZodType, path = '#', active = new Set<z.ZodType>()): void {
    if (active.has(schema)) fail(path, 'recursive schemas are not supported');
    active.add(schema);
    const def = schema._zod.def as z.core.$ZodTypes['_zod']['def'];
    if (def.type === 'custom') fail(path, 'custom schemas have no representable input domain');
    if (def.type === 'pipe' && def.in._zod.def.type === 'transform')
        fail(path, 'preprocessing has no representable input domain');
    if (!Object.hasOwn(representableZodTypes, def.type))
        fail(path, 'Zod input domain cannot be represented as JSON Schema');
    if ('coerce' in def && def.coerce) fail(path, 'coercion has no representable input domain');
    if (def.type === 'object' && def.catchall && def.catchall._zod.def.type !== 'never')
        fail(path, 'objects must reject additional properties');
    const checks = (def.checks ?? []).map(check => check._zod.def);
    if ('check' in def) checks.push(def as z.core.$ZodCheckDef);
    for (const check of checks) {
        const kind = check.check;
        if (!Object.hasOwn(projectedZodChecks, kind)) fail(path, 'Zod check cannot be represented');
    }
    if (def.type === 'transform') {
        active.delete(schema);
        return;
    }
    const visitValue = (value: unknown, childPath: string): void => {
        if (value instanceof z.ZodType) inspectZod(value, childPath, active);
        else if (Array.isArray(value))
            value.forEach((child, index) => visitValue(child, `${childPath}/${index}`));
        else if (record(value))
            for (const [key, child] of Object.entries(value))
                visitValue(child, `${childPath}/${segment(key)}`);
    };
    if (def.type === 'lazy') visitValue((def as z.core.$ZodLazyDef).getter(), `${path}/lazy`);
    else
        for (const [key, value] of Object.entries(def)) {
            if (['checks', 'error'].includes(key) || (def.type === 'object' && key === 'catchall'))
                continue;
            visitValue(value, `${path}/${segment(key)}`);
        }
    active.delete(schema);
}

/** Portable input structure; no provider strictness or omitted-constraint guarantee. */
export function compileProjectedSchema(schema: z.ZodType): Record<string, unknown> {
    let compiled: Record<string, unknown>;
    try {
        inspectZod(schema);
        compiled = z.toJSONSchema(schema, {
            target: 'draft-2020-12',
            io: 'input',
            unrepresentable: 'throw',
            cycles: 'throw',
            reused: 'inline',
            override: ({ zodSchema, jsonSchema }) => {
                // Default Zod objects strip unknown keys; constrain generated input to their declared fields.
                // Strict and optional semantics remain unchanged; passthrough/catchall objects are rejected.
                if (zodSchema._zod.def.type === 'object' && !zodSchema._zod.def.catchall)
                    jsonSchema.additionalProperties = false;
                // Fixed scalar hints only; arbitrary schema descriptions never cross this boundary.
                delete jsonSchema.description;
                if (
                    zodSchema instanceof z.ZodString &&
                    (zodSchema.minLength !== null || zodSchema.maxLength !== null)
                )
                    jsonSchema.description = `Length must be between ${zodSchema.minLength ?? 0} and ${zodSchema.maxLength ?? 'unbounded'} characters. Local validation remains authoritative.`;
                // Modify only the exported provider schema, never the original validator.
                for (const keyword of omittedProviderConstraints) delete jsonSchema[keyword];
                if (
                    'minItems' in jsonSchema &&
                    jsonSchema.minItems !== 0 &&
                    jsonSchema.minItems !== 1
                )
                    delete jsonSchema.minItems;
                if (
                    'format' in jsonSchema &&
                    (typeof jsonSchema.format !== 'string' ||
                        !Object.hasOwn(formats, jsonSchema.format))
                )
                    delete jsonSchema.format;
            },
        }) as Record<string, unknown>;
    } catch (error) {
        if (error instanceof BedrockSchemaError) throw error;
        fail('#', 'Zod input domain cannot be represented as JSON Schema');
    }
    validateBedrockJsonSchema(compiled);
    return compiled;
}

/** Return the original schema's parsed value, including async transformations. */
export async function parseBedrockOutput(value: unknown, schema: z.ZodType): Promise<unknown> {
    return schema.parseAsync(value);
}
