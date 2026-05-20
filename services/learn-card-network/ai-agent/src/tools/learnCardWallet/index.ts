import { existsSync } from 'node:fs';
import path from 'node:path';

import { createFileBackedSkill } from '../../agent/skills';
import type { AgentToolDefinition } from '../../agent/types';
import {
    getAgentLearnCard,
    type AgentLearnCardConfig,
    type AgentNetworkWallet,
} from '../../helpers/learnCard.helpers';

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
    sourcePreview?: string;
}

const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);
const DEFAULT_INSPECT_LIMIT = 50;
const MAX_INSPECT_LIMIT = 200;
const SOURCE_PREVIEW_LIMIT = 500;

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

Use the learnCardWallet tool with operation "inspect" to discover wallet planes and operation "call" to invoke a method by dot path.

Examples:
- Inspect root: {"operation":"inspect","path":""}
- Get this wallet DID: {"operation":"call","path":"id.did","args":[]}
- Get a profile: {"operation":"call","path":"invoke.getProfile","args":["profileId"]}
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
    const parameters =
        parsedParameters && parsedParameters.length > 0
            ? parsedParameters
            : Array.from({ length: value.length }, (_value, index) => `arg${index + 1}`);
    const name = value.name || fallbackName || '(anonymous)';
    const asyncFunction = source.trim().startsWith('async ');

    return {
        name,
        path: walletPath,
        arity: value.length,
        async: asyncFunction,
        parameters,
        parametersInferred: parsedParameters === undefined,
        signature: `${asyncFunction ? 'async ' : ''}${name}(${parameters.join(', ')})`,
        ...(includeSource ? { sourcePreview: source.slice(0, SOURCE_PREVIEW_LIMIT) } : {}),
    };
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
    execute: async args => {
        const operation = getOperation(args);
        const walletPath = getPath(args);
        const wallet = config.getWallet
            ? await config.getWallet()
            : await getAgentLearnCard(config);

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

        const result = await value.apply(parent, getCallArgs(args));

        return {
            path: walletPath,
            result: result === undefined ? null : result,
            resultType: getResultType(result),
            hasResult: result !== undefined,
        };
    },
});
