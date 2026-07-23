import { existsSync } from 'node:fs';
import path from 'node:path';

import { createFileBackedSkill } from '../../agent/skills';
import type { AgentToolDefinition } from '../../agent/types';
import {
    getAgentLearnCard,
    type AgentLearnCardConfig,
    type AgentNetworkWallet,
} from '../../helpers/learnCard.helpers';
import {
    getLearnCardWalletMethodMetadata,
    type LearnCardWalletMethodArgument,
    type LearnCardWalletMethodExample,
} from './methodMetadata';

export interface LearnCardWalletToolConfig extends AgentLearnCardConfig {
    getWallet?: () => Promise<AgentNetworkWallet>;
}

type WalletPathResolution = {
    parent: unknown;
    value: unknown;
};

interface InspectOptions {
    query?: string;
    limit: number;
    includeSource: boolean;
}

interface FunctionInspection {
    name: string;
    path: string;
    arity: number;
    async: boolean;
    parameters: string[];
    parametersInferred: boolean;
    signature: string;
    description?: string;
    argumentDetails?: LearnCardWalletMethodArgument[];
    returns?: string;
    preconditions?: string[];
    notes?: string[];
    examples?: LearnCardWalletMethodExample[];
    metadataSource?: string;
    sourcePreview?: string;
}

const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);
const DEFAULT_INSPECT_LIMIT = 50;
const MAX_INSPECT_LIMIT = 200;
const SOURCE_PREVIEW_LIMIT = 500;
const MAX_ERROR_STRING_LENGTH = 1_000;
const MAX_ERROR_DEPTH = 4;
const MAX_ERROR_ARRAY_ITEMS = 8;
const MAX_ERROR_OBJECT_KEYS = 20;
const REDACTED_VALUE = '[redacted]';
const SENSITIVE_KEY_PATTERN =
    /(?:api[-_]?key|authorization|bearer|mnemonic|password|private|refresh[-_]?token|secret|seed|token)/i;
const ARG_SUMMARY_SCALAR_KEYS = new Set([
    'boostUri',
    'category',
    'did',
    'email',
    'encrypt',
    'endpoint',
    'id',
    'name',
    'phone',
    'profileId',
    'recipient',
    'skipNotification',
    'status',
    'suppressDelivery',
    'templateUri',
    'type',
    'uri',
    'value',
]);

const learnCardWalletParameters = {
    type: 'object',
    properties: {
        operation: {
            type: 'string',
            enum: ['call', 'inspect'],
            description:
                'Use "call" to invoke a wallet method, or "inspect" to list available properties at a wallet path. Defaults to "call".',
        },
        path: {
            type: 'string',
            description:
                'Dot-separated path on the wallet, such as "id.did", "invoke.getProfile", or "store.LearnCloud.uploadEncrypted". Use an empty string to inspect the wallet root.',
        },
        args: {
            type: 'array',
            items: {},
            description:
                'Positional arguments for call operations. Pass objects inside this array when a wallet method expects an options object.',
        },
        query: {
            type: 'string',
            description:
                'Optional case-insensitive filter for inspect operations. Useful for large namespaces such as "invoke".',
        },
        limit: {
            type: 'number',
            description: `Maximum number of inspect entries to return. Defaults to ${DEFAULT_INSPECT_LIMIT}.`,
        },
        includeSource: {
            type: 'boolean',
            description:
                'When true, include a short function source preview during inspect. Defaults to false.',
        },
    },
    additionalProperties: false,
};

const DEFAULT_SKILL_CONTENT = `---
name: learncard-wallet
description: Use the configured LearnCard wallet through one freeform tool.
---

# LearnCard Wallet

Use the learnCardWallet tool with operation "inspect" to discover wallet planes and operation "call" to invoke a method by dot path. Inspect exact functions before writes; common LearnCard Network methods include TypeScript-derived argument metadata. Failed calls return a bounded diagnostic payload with method, argsSummary, underlyingError, knownUsage, and failureHints.

Examples:
- Inspect root: {"operation":"inspect","path":""}
- Inspect sendBoost: {"operation":"inspect","path":"invoke.sendBoost"}
- Get this wallet DID: {"operation":"call","path":"id.did","args":[]}
- Get a profile: {"operation":"call","path":"invoke.getProfile","args":["profileId"]}
- Send a Boost: {"operation":"call","path":"invoke.sendBoost","args":["profileId","lc:network:.../trpc:boost:..."]}
`;

const parseWalletPath = (walletPath: string): string[] => {
    const pathSegments = walletPath
        .split('.')
        .map(segment => segment.trim())
        .filter(Boolean);

    for (const segment of pathSegments) {
        if (UNSAFE_PATH_SEGMENTS.has(segment)) {
            throw new Error(`Unsafe wallet path segment: ${segment}`);
        }
    }

    return pathSegments;
};

const getChildPath = (walletPath: string, childName: string): string =>
    walletPath ? `${walletPath}.${childName}` : childName;

const resolveWalletPath = (
    wallet: AgentNetworkWallet,
    walletPath: string
): WalletPathResolution => {
    const segments = parseWalletPath(walletPath);
    let parent: unknown;
    let value: unknown = wallet;

    for (const segment of segments) {
        if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
            throw new Error(`Wallet path is not reachable: ${walletPath}`);
        }

        parent = value;
        value = (value as Record<string, unknown>)[segment];

        if (value === undefined) {
            throw new Error(`Unknown wallet path: ${walletPath}`);
        }
    }

    return { parent, value };
};

const getInspectableKeys = (value: unknown): string[] => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return [];

    const keys = new Set<string>();
    let current: unknown = value;

    while (current && (typeof current === 'object' || typeof current === 'function')) {
        for (const key of Object.getOwnPropertyNames(current)) {
            if (!UNSAFE_PATH_SEGMENTS.has(key)) keys.add(key);
        }

        current = Object.getPrototypeOf(current);
        if (!current || current === Object.prototype || current === Function.prototype) break;
    }

    return [...keys].sort((a, b) => a.localeCompare(b));
};

const stripSourceComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const splitParameters = (parameters: string): string[] => {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    let quote: string | undefined;

    for (const character of parameters) {
        if (quote) {
            current += character;

            if (character === quote) quote = undefined;
            continue;
        }

        if (character === '"' || character === "'" || character === '`') {
            quote = character;
            current += character;
            continue;
        }

        if (character === '(' || character === '[' || character === '{') depth += 1;
        if (character === ')' || character === ']' || character === '}') depth -= 1;

        if (character === ',' && depth === 0) {
            const part = current.trim();
            if (part) parts.push(part);
            current = '';
            continue;
        }

        current += character;
    }

    const finalPart = current.trim();
    if (finalPart) parts.push(finalPart);

    return parts;
};

const extractParameterText = (source: string): string | undefined => {
    const trimmedSource = stripSourceComments(source).trim();
    const arrowFunctionMatch = trimmedSource.match(/^(?:async\s*)?\(([^)]*)\)\s*=>/);
    if (arrowFunctionMatch?.[1] !== undefined) return arrowFunctionMatch[1];

    const singleArgumentArrowMatch = trimmedSource.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*=>/);
    if (singleArgumentArrowMatch?.[1]) return singleArgumentArrowMatch[1];

    const functionMatch = trimmedSource.match(
        /^(?:async\s+)?(?:function(?:\s+[A-Za-z_$][\w$]*)?\s*)?\(([^)]*)\)/
    );
    if (functionMatch?.[1] !== undefined) return functionMatch[1];

    const methodMatch = trimmedSource.match(
        /^(?:async\s+)?(?:[A-Za-z_$][\w$]*\s*)?\(([^)]*)\)\s*\{/
    );
    if (methodMatch?.[1] !== undefined) return methodMatch[1];

    return undefined;
};

const getFunctionInspection = (
    value: (...args: unknown[]) => unknown,
    walletPath: string,
    fallbackName: string,
    includeSource: boolean
): FunctionInspection => {
    const source = Function.prototype.toString.call(value);
    const parameterText = extractParameterText(source);
    const parsedParameters =
        parameterText !== undefined ? splitParameters(parameterText) : undefined;
    const fallbackParameters = Array.from(
        { length: value.length },
        (_value, index) => `arg${index + 1}`
    );
    const sourceParameters =
        parsedParameters && parsedParameters.length > 0 ? parsedParameters : fallbackParameters;
    const sourceParametersAreGeneric = sourceParameters.every(
        (parameter, index) => parameter === `arg${index + 1}`
    );
    const metadata = getLearnCardWalletMethodMetadata(walletPath);
    const useMetadata = Boolean(metadata && sourceParametersAreGeneric);
    const parameters = useMetadata && metadata ? metadata.parameters : sourceParameters;
    const name =
        useMetadata && metadata
            ? parseWalletPath(walletPath).at(-1) ?? fallbackName
            : value.name || fallbackName || '(anonymous)';
    const asyncFunction = source.trim().startsWith('async ');

    return {
        name,
        path: walletPath,
        arity: value.length,
        async: asyncFunction,
        parameters,
        parametersInferred: parsedParameters === undefined || sourceParametersAreGeneric,
        signature:
            useMetadata && metadata
                ? metadata.signature
                : `${asyncFunction ? 'async ' : ''}${name}(${parameters.join(', ')})`,
        ...(metadata
            ? {
                  description: metadata.description,
                  argumentDetails: metadata.arguments,
                  returns: metadata.returns,
                  ...(metadata.preconditions ? { preconditions: metadata.preconditions } : {}),
                  ...(metadata.notes ? { notes: metadata.notes } : {}),
                  ...(metadata.examples ? { examples: metadata.examples } : {}),
                  metadataSource: metadata.metadataSource,
              }
            : {}),
        ...(includeSource ? { sourcePreview: source.slice(0, SOURCE_PREVIEW_LIMIT) } : {}),
    };
};

const truncateString = (value: string, maxLength = MAX_ERROR_STRING_LENGTH): string =>
    value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const sanitizeDiagnosticValue = (
    value: unknown,
    depth = 0,
    seen: WeakSet<object> = new WeakSet(),
    keyName = ''
): unknown => {
    if (SENSITIVE_KEY_PATTERN.test(keyName)) return REDACTED_VALUE;
    if (typeof value === 'string') return truncateString(value);
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'undefined') return 'undefined';
    if (typeof value === 'function') return '[function]';
    if (typeof value !== 'object') return String(value);
    if (seen.has(value)) return '[circular]';
    if (depth >= MAX_ERROR_DEPTH) return `[${Array.isArray(value) ? 'array' : 'object'}]`;

    seen.add(value);

    if (Array.isArray(value)) {
        return {
            type: 'array',
            length: value.length,
            items: value
                .slice(0, MAX_ERROR_ARRAY_ITEMS)
                .map(item => sanitizeDiagnosticValue(item, depth + 1, seen)),
            ...(value.length > MAX_ERROR_ARRAY_ITEMS ? { truncated: true } : {}),
        };
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).slice(0, MAX_ERROR_OBJECT_KEYS);
    const result: Record<string, unknown> = {};

    for (const key of keys) {
        result[key] = sanitizeDiagnosticValue(record[key], depth + 1, seen, key);
    }

    if (Object.keys(record).length > MAX_ERROR_OBJECT_KEYS) {
        result.truncatedKeys = Object.keys(record).length - MAX_ERROR_OBJECT_KEYS;
    }

    return result;
};

const serializeWalletError = (error: unknown, seen: WeakSet<object> = new WeakSet()): unknown => {
    if (error instanceof Error) {
        if (seen.has(error)) return '[circular-error]';

        seen.add(error);

        const errorRecord = error as Error & Record<string, unknown>;
        const serialized: Record<string, unknown> = {
            name: error.name,
            message: truncateString(error.message || 'Wallet method call failed.'),
        };
        const propertyNames = Object.getOwnPropertyNames(error).filter(
            propertyName => !['name', 'message', 'stack', 'cause'].includes(propertyName)
        );

        for (const propertyName of propertyNames) {
            serialized[propertyName] = sanitizeDiagnosticValue(
                errorRecord[propertyName],
                0,
                seen,
                propertyName
            );
        }

        if (errorRecord.cause !== undefined) {
            serialized.cause = serializeWalletError(errorRecord.cause, seen);
        }

        if (error.stack) {
            serialized.stackPreview = error.stack
                .split('\n')
                .slice(0, 5)
                .map(line => truncateString(line.trim(), 300));
        }

        return serialized;
    }

    return sanitizeDiagnosticValue(error, 0, seen);
};

const summarizeCallArg = (value: unknown, keyName = ''): unknown => {
    if (SENSITIVE_KEY_PATTERN.test(keyName)) return REDACTED_VALUE;
    if (typeof value === 'string') return truncateString(value, 240);
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
    if (typeof value === 'undefined') return 'undefined';
    if (Array.isArray(value)) {
        return {
            type: 'array',
            length: value.length,
            items: value.slice(0, 4).map(item => summarizeCallArg(item)),
            ...(value.length > 4 ? { truncated: true } : {}),
        };
    }

    if (!isRecord(value)) return `[${typeof value}]`;

    const keys = Object.keys(value);
    const fields = Object.fromEntries(
        keys
            .filter(key => ARG_SUMMARY_SCALAR_KEYS.has(key))
            .map(key => [key, summarizeCallArg(value[key], key)])
    );

    return {
        type: 'object',
        keys: keys.slice(0, 12),
        keyCount: keys.length,
        ...(Object.keys(fields).length > 0 ? { fields } : {}),
        ...(keys.length > 12 ? { truncatedKeys: keys.length - 12 } : {}),
    };
};

const createWalletCallFailureMessage = (
    walletPath: string,
    callArgs: unknown[],
    error: unknown
): string => {
    const metadata = getLearnCardWalletMethodMetadata(walletPath);
    const payload = {
        error: 'Wallet method call failed',
        method: walletPath,
        argsSummary: callArgs.map(arg => summarizeCallArg(arg)),
        underlyingError: serializeWalletError(error),
        ...(metadata
            ? {
                  knownUsage: metadata.signature,
                  ...(metadata.failureHints ? { failureHints: metadata.failureHints } : {}),
                  metadataSource: metadata.metadataSource,
              }
            : {}),
    };

    return JSON.stringify(payload, null, 2);
};

const matchesQuery = (query: string | undefined, values: string[]): boolean => {
    if (!query) return true;

    const normalizedQuery = query.toLowerCase();

    return values.some(value => value.toLowerCase().includes(normalizedQuery));
};

const inspectWalletPath = (
    wallet: AgentNetworkWallet,
    walletPath: string,
    { query, limit, includeSource }: InspectOptions
): unknown => {
    const { value } = resolveWalletPath(wallet, walletPath);

    if (typeof value === 'function') {
        return {
            path: walletPath,
            kind: 'function',
            function: getFunctionInspection(
                value as (...args: unknown[]) => unknown,
                walletPath,
                parseWalletPath(walletPath).at(-1) ?? '',
                includeSource
            ),
        };
    }

    const functions: FunctionInspection[] = [];
    const objects: Array<{ name: string; path: string }> = [];
    const values: Array<{ name: string; path: string; type: string }> = [];
    let totalFunctions = 0;
    let totalObjects = 0;
    let totalValues = 0;

    for (const key of getInspectableKeys(value)) {
        let child: unknown;
        const childPath = getChildPath(walletPath, key);

        try {
            child = (value as Record<string, unknown>)[key];
        } catch {
            if (matchesQuery(query, [key, childPath, 'unreadable'])) {
                totalValues += 1;
                if (values.length < limit)
                    values.push({ name: key, path: childPath, type: 'unreadable' });
            }
            continue;
        }

        if (typeof child === 'function') {
            const functionInspection = getFunctionInspection(
                child as (...args: unknown[]) => unknown,
                childPath,
                key,
                includeSource
            );

            if (
                matchesQuery(query, [
                    key,
                    childPath,
                    functionInspection.signature,
                    ...functionInspection.parameters,
                ])
            ) {
                totalFunctions += 1;
                if (functions.length < limit) functions.push(functionInspection);
            }
        } else if (child && typeof child === 'object') {
            if (matchesQuery(query, [key, childPath, 'object'])) {
                totalObjects += 1;
                if (objects.length < limit) objects.push({ name: key, path: childPath });
            }
        } else {
            const childType = child === null ? 'null' : typeof child;

            if (matchesQuery(query, [key, childPath, childType])) {
                totalValues += 1;
                if (values.length < limit) {
                    values.push({ name: key, path: childPath, type: childType });
                }
            }
        }
    }

    const returned = functions.length + objects.length + values.length;
    const total = totalFunctions + totalObjects + totalValues;

    return {
        path: walletPath,
        kind: 'object',
        query,
        limit,
        functions,
        objects,
        values,
        counts: {
            functions: totalFunctions,
            objects: totalObjects,
            values: totalValues,
            total,
            returned,
        },
        truncated: returned < total,
        ...(returned < total
            ? { hint: 'Use query and/or a higher limit to narrow this inspection.' }
            : {}),
    };
};

const getOperation = (args: Record<string, unknown>): 'call' | 'inspect' =>
    args.operation === 'inspect' ? 'inspect' : 'call';

const getPath = (args: Record<string, unknown>): string =>
    typeof args.path === 'string' ? args.path.trim() : '';

const getCallArgs = (args: Record<string, unknown>): unknown[] =>
    Array.isArray(args.args) ? args.args : [];

const getInspectOptions = (args: Record<string, unknown>): InspectOptions => {
    const requestedLimit =
        typeof args.limit === 'number' ? Math.floor(args.limit) : DEFAULT_INSPECT_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_INSPECT_LIMIT);
    const query = typeof args.query === 'string' ? args.query.trim() : '';

    return {
        limit,
        query: query || undefined,
        includeSource: args.includeSource === true,
    };
};

const getResultType = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';

    return typeof value;
};

const fallbackSkillFilePath = path.resolve(process.cwd(), 'src/tools/learnCardWallet/SKILL.md');
const skillFilePathCandidates = [
    fallbackSkillFilePath,
    path.resolve(
        process.cwd(),
        'services/learn-card-network/ai-agent/src/tools/learnCardWallet/SKILL.md'
    ),
];
const skillFilePath =
    skillFilePathCandidates.find(candidatePath => existsSync(candidatePath)) ??
    fallbackSkillFilePath;

export const createLearnCardWalletTool = (
    config: LearnCardWalletToolConfig
): AgentToolDefinition => ({
    name: 'learnCardWallet',
    description:
        'Freeform bridge to the configured LearnCard wallet. Load the learncard-wallet skill before first use.',
    parameters: learnCardWalletParameters,
    skill: createFileBackedSkill({
        name: 'learncard-wallet',
        description:
            'How to inspect and call the configured LearnCard wallet with the freeform learnCardWallet tool.',
        filePath: skillFilePath,
        fallbackContent: DEFAULT_SKILL_CONTENT,
    }),
    execute: async (args, context) => {
        const operation = getOperation(args);
        const walletPath = getPath(args);
        const wallet = config.getWallet
            ? await config.getWallet()
            : await getAgentLearnCard(config);
        context.signal?.throwIfAborted();

        if (operation === 'inspect') {
            return inspectWalletPath(wallet, walletPath, getInspectOptions(args));
        }

        if (!walletPath) {
            throw new Error('A wallet method path is required for call operations.');
        }

        const { parent, value } = resolveWalletPath(wallet, walletPath);

        if (typeof value !== 'function') {
            throw new Error(`Wallet path is not callable: ${walletPath}`);
        }

        const callArgs = getCallArgs(args);
        let result: unknown;

        try {
            context.signal?.throwIfAborted();
            result = await value.apply(parent, callArgs);
            context.signal?.throwIfAborted();
        } catch (error) {
            context.signal?.throwIfAborted();
            throw new Error(createWalletCallFailureMessage(walletPath, callArgs, error));
        }

        return {
            path: walletPath,
            result: result === undefined ? null : result,
            resultType: getResultType(result),
            hasResult: result !== undefined,
        };
    },
});
