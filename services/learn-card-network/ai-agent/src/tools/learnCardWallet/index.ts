import { existsSync } from 'node:fs';
import path from 'node:path';

import { getAnonymousClient, type LCNClient } from '@learncard/network-brain-client';

import { createFileBackedSkill } from '../../agent/skills';
import type { AgentToolDefinition } from '../../agent/types';
import {
    getAgentLearnCard,
    type AgentLearnCardConfig,
    type AgentNetworkWallet,
} from '../../helpers/learnCard.helpers';
import { getLearnCardWalletMethodMetadata } from './methodMetadata';

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
}

const DEFAULT_INSPECT_LIMIT = 50;
const MAX_INSPECT_LIMIT = 200;

// Authorization policy, deliberately independent of SDK metadata. New methods
// remain inaccessible until reviewed for public lookup or credential issuance.
const PERMITTED_METHODS: Record<string, true> = {
    'id.did': true,
    'invoke.getProfile': true,
    'invoke.searchProfiles': true,
    'invoke.createBoost': true,
    'invoke.createChildBoost': true,
    'invoke.getBoost': true,
    'invoke.sendBoost': true,
    'invoke.send': true,
    'invoke.issueCredential': true,
    'invoke.sendCredentialViaInbox': true,
};
const PERMITTED_NAMESPACES = ['', 'id', 'invoke'];

const learnCardWalletParameters = {
    type: 'object',
    properties: {
        operation: {
            type: 'string',
            enum: ['call', 'inspect'],
            description: 'Call an approved wallet capability, or inspect approved capabilities.',
        },
        path: {
            type: 'string',
            description:
                'Exact approved method path, such as "id.did" or "invoke.getProfile". Inspect "", "id", or "invoke" to discover permitted capabilities.',
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
    },
    additionalProperties: false,
};

const DEFAULT_SKILL_CONTENT = `---
name: learncard-wallet
description: Use approved LearnCard wallet capabilities.
---

# LearnCard Wallet

Requires a server-authenticated owner. Inspect lists only approved public lookup and credential issuance capabilities. All other paths are denied. Private learner data must use getConsentedUserData. Keys, account management, aggregate reads, raw storage, and decryption are unavailable. Template URIs must be LearnCard Network Boost URIs. Inspect exact functions before writes; failed calls return a fixed diagnostic.

Profile reads use an anonymous Brain client, never service credentials. getProfile requires an explicit profile ID; searchProfiles permits only limit and includeServiceProfiles options. Self/connection-status options are denied. Boost URIs may include preview path prefixes and local ports; reuse the URI returned by createBoost.

Examples:
- Inspect root: {"operation":"inspect","path":""}
- Inspect sendBoost: {"operation":"inspect","path":"invoke.sendBoost"}
- Get this wallet DID: {"operation":"call","path":"id.did","args":[]}
- Get a profile: {"operation":"call","path":"invoke.getProfile","args":["profileId"]}
`;

interface PublicProfileMethods {
    getProfile: (profileId: string) => Promise<unknown>;
    searchProfiles: (
        input?: string,
        options?: { limit?: number; includeServiceProfiles?: boolean }
    ) => Promise<unknown>;
}

const createPublicProfileMethods = (config: LearnCardWalletToolConfig): PublicProfileMethods => {
    // Separate transport authority, not a response-field filter over service reads.
    let client: LCNClient | undefined;
    const getClient = () =>
        (client ??= getAnonymousClient(config.networkUrl ?? 'https://network.learncard.com/trpc'));
    return {
        getProfile: (profileId: string) => getClient().profile.getOtherProfile.query({ profileId }),
        searchProfiles: (
            input = '',
            options: { limit?: number; includeServiceProfiles?: boolean } = {}
        ) =>
            getClient().profile.searchProfiles.query({
                input,
                limit: options.limit,
                includeServiceProfiles: options.includeServiceProfiles,
                includeSelf: false,
                includeConnectionStatus: false,
            }),
    };
};
const isPublicProfilePath = (walletPath: string): boolean =>
    walletPath === 'invoke.getProfile' || walletPath === 'invoke.searchProfiles';

const assertPermittedPath = (walletPath: string, operation: 'call' | 'inspect'): void => {
    if (Object.hasOwn(PERMITTED_METHODS, walletPath)) return;
    if (operation === 'inspect' && PERMITTED_NAMESPACES.includes(walletPath)) return;
    throw new Error(`Wallet capability is not permitted: ${walletPath}`);
};

const resolveWalletMethod = (
    wallet: AgentNetworkWallet | undefined,
    walletPath: string,
    publicProfiles: PublicProfileMethods
): WalletPathResolution => {
    assertPermittedPath(walletPath, 'call');
    if (isPublicProfilePath(walletPath)) {
        const method = walletPath.split('.')[1] as keyof PublicProfileMethods;
        return { parent: publicProfiles, value: publicProfiles[method] };
    }
    // Every approved path has exactly two segments; never traverse user-selected
    // objects or function properties (call/apply/bind).
    const [namespace, method] = walletPath.split('.') as ['id' | 'invoke', string];
    const parent = wallet?.[namespace];
    const value = parent && (parent as unknown as Record<string, unknown>)[method];
    return { parent, value };
};

const getFunctionInspection = (walletPath: string) => {
    const metadata = getLearnCardWalletMethodMetadata(walletPath);
    return {
        name: walletPath.split('.')[1],
        ...metadata,
        path: walletPath,
        argumentDetails: metadata?.arguments,
    };
};

const requireBoostUri = (uri: unknown): void => {
    // Brain constructUri/getUriParts delimit the domain (including path prefixes
    // and encoded or raw port colons) with /trpc:, not with the first slash.
    // sendBoost/send can otherwise fall back to resolving private storage.
    if (
        typeof uri !== 'string' ||
        !/^lc:network:[^/\s?#]+(?:\/[^/\s:?#]+)*\/trpc:boost:[A-Za-z0-9_-]+$/.test(uri)
    ) {
        throw new Error('Only LearnCard Network Boost template URIs are permitted.');
    }
};

const assertPermittedArguments = (walletPath: string, args: unknown[]): void => {
    if (walletPath === 'invoke.getProfile') {
        if (args.length !== 1 || typeof args[0] !== 'string' || !args[0].trim()) {
            throw new Error(
                'Public profile lookup requires an explicit profile ID and no options.'
            );
        }
    }
    if (walletPath === 'invoke.searchProfiles') {
        if (args.length > 2 || (args[0] !== undefined && typeof args[0] !== 'string')) {
            throw new Error('Public profile search accepts search text and public options only.');
        }
        const options = args[1];
        if (
            options !== undefined &&
            (!isRecord(options) ||
                Object.keys(options).some(
                    key => key !== 'limit' && key !== 'includeServiceProfiles'
                ) ||
                (options.limit !== undefined &&
                    (typeof options.limit !== 'number' ||
                        !Number.isInteger(options.limit) ||
                        options.limit < 1 ||
                        options.limit >= 100)) ||
                (options.includeServiceProfiles !== undefined &&
                    typeof options.includeServiceProfiles !== 'boolean'))
        ) {
            throw new Error(
                'Only limit and includeServiceProfiles are permitted public search options.'
            );
        }
    }
    if (walletPath === 'invoke.sendBoost') requireBoostUri(args[1]);
    if (walletPath === 'invoke.getBoost' || walletPath === 'invoke.createChildBoost') {
        requireBoostUri(args[0]);
    }
    if (walletPath === 'invoke.send' || walletPath === 'invoke.sendCredentialViaInbox') {
        const input = args[0];
        if (!isRecord(input)) throw new Error('A credential send input is required.');
        if (walletPath === 'invoke.send' && input.type !== 'boost') {
            throw new Error('Only Boost credential sends are permitted.');
        }
        if (input.templateUri !== undefined) requireBoostUri(input.templateUri);
    }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const matchesQuery = (query: string | undefined, values: string[]): boolean => {
    if (!query) return true;

    const normalizedQuery = query.toLowerCase();

    return values.some(value => value.toLowerCase().includes(normalizedQuery));
};

const inspectWalletPath = (
    wallet: AgentNetworkWallet | undefined,
    walletPath: string,
    { query, limit }: InspectOptions,
    publicProfiles: PublicProfileMethods
): unknown => {
    assertPermittedPath(walletPath, 'inspect');
    if (Object.hasOwn(PERMITTED_METHODS, walletPath)) {
        const { value } = resolveWalletMethod(wallet, walletPath, publicProfiles);
        if (typeof value !== 'function') {
            throw new Error(`Wallet capability is unavailable: ${walletPath}`);
        }
        return { path: walletPath, kind: 'function', function: getFunctionInspection(walletPath) };
    }

    // Inspect the facade, never enumerate or read hidden wallet properties.
    const objects = walletPath
        ? []
        : PERMITTED_NAMESPACES.filter(
              namespace => namespace && wallet?.[namespace as 'id' | 'invoke']
          )
              .filter(namespace => matchesQuery(query, [namespace]))
              .map(namespace => ({ name: namespace, path: namespace }));
    const functions = walletPath
        ? Object.keys(PERMITTED_METHODS)
              .filter(methodPath => methodPath.startsWith(`${walletPath}.`))
              .filter(
                  methodPath =>
                      typeof resolveWalletMethod(wallet, methodPath, publicProfiles).value ===
                      'function'
              )
              .map(getFunctionInspection)
              .filter(method => matchesQuery(query, [method.path, method.signature ?? '']))
        : [];
    const total = objects.length + functions.length;
    const returnedObjects = objects.slice(0, limit);
    const returnedFunctions = functions.slice(0, limit - returnedObjects.length);
    const returned = returnedObjects.length + returnedFunctions.length;
    return {
        path: walletPath,
        kind: 'object',
        query,
        limit,
        functions: returnedFunctions,
        objects: returnedObjects,
        values: [],
        counts: {
            functions: functions.length,
            objects: objects.length,
            values: 0,
            total,
            returned,
        },
        truncated: returned < total,
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
): AgentToolDefinition => {
    const publicProfiles = createPublicProfileMethods(config);
    return {
        name: 'learnCardWallet',
        description:
            'Approved public lookup and credential issuance capabilities. Requires an authenticated owner. Load the learncard-wallet skill before first use.',
        parameters: learnCardWalletParameters,
        skill: createFileBackedSkill({
            name: 'learncard-wallet',
            description: 'How to inspect and call approved LearnCard wallet capabilities.',
            filePath: skillFilePath,
            fallbackContent: DEFAULT_SKILL_CONTENT,
        }),
        execute: async (args, context) => {
            if (!context.ownerDid?.trim()) {
                throw new Error('An authenticated owner DID is required for wallet operations.');
            }
            context.signal?.throwIfAborted();
            const operation = getOperation(args);
            const walletPath = getPath(args);
            assertPermittedPath(walletPath, operation);
            const callArgs = getCallArgs(args);
            if (operation === 'call') assertPermittedArguments(walletPath, callArgs);
            const wallet = isPublicProfilePath(walletPath)
                ? undefined
                : config.getWallet
                  ? await config.getWallet()
                  : await getAgentLearnCard(config);
            context.signal?.throwIfAborted();

            if (operation === 'inspect') {
                return inspectWalletPath(
                    wallet,
                    walletPath,
                    getInspectOptions(args),
                    publicProfiles
                );
            }

            const { parent, value } = resolveWalletMethod(wallet, walletPath, publicProfiles);

            if (typeof value !== 'function') {
                throw new Error(`Wallet path is not callable: ${walletPath}`);
            }

            let result: unknown;

            try {
                context.signal?.throwIfAborted();
                result = await value.apply(parent, callArgs);
                context.signal?.throwIfAborted();
            } catch (error) {
                context.signal?.throwIfAborted();
                // Error.message is approved for operational capture. Never
                // flatten arbitrary backend fields or raw frames into it.
                throw new Error('Wallet method call failed.', { cause: error });
            }

            return {
                path: walletPath,
                result: result === undefined ? null : result,
                resultType: getResultType(result),
                hasResult: result !== undefined,
            };
        },
    };
};
