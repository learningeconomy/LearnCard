import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as LearnCardTypes from '@learncard/types';
import * as notifications from '@helpers/notifications.helpers';

import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    areProfilesConnected,
    blockProfile,
    connectProfiles,
    disconnectProfiles,
    ensureMutualConnectionsForRows,
    ensureMutualConnectionWithSource,
    requestConnection,
    unblockProfile,
} from '@helpers/connection.helpers';
import {
    connectWithConnectionPrompt,
    createConnectionPromptsForClaim,
    getConnectionPromptStatus,
    getPendingConnectionPrompts,
    handleConnectionPromptsForCredentialClaim,
    skipConnectionPrompt,
} from '@helpers/connectionPrompt.helpers';
import { neogma } from '@instance';
import { Profile } from '@models';
import { ProfileType } from 'types/profile';

import { getClient, getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;
let profileA: ProfileType;
let profileB: ProfileType;
let profileC: ProfileType;

const createPrompts = (triggerId: string) =>
    createConnectionPromptsForClaim({
        claimer: profileB,
        sender: profileA,
        triggerId,
    });

describe('connection prompt public contracts', () => {
    it('validates the public prompt shape', () => {
        const validator = (
            LearnCardTypes as unknown as {
                LCNConnectionPromptValidator?: {
                    safeParse: (value: unknown) => { success: boolean };
                };
            }
        ).LCNConnectionPromptValidator;

        expect(
            validator?.safeParse({
                promptId: '00000000-0000-4000-8000-000000000001',
                status: 'PENDING',
                surface: 'POST_CLAIM',
                triggerId: 'credential:claim-1',
                triggeredAt: '2026-08-20T12:00:00.000Z',
                updatedAt: '2026-08-20T12:00:00.000Z',
                counterpart: { profileId: 'usera' },
            }).success
        ).toBe(true);
    });

    it('accepts stale as an action result without making it durable prompt state', () => {
        const validators = LearnCardTypes as unknown as {
            LCNConnectionPromptValidator?: {
                safeParse: (value: unknown) => { success: boolean };
            };
            LCNConnectionPromptActionResultValidator?: {
                safeParse: (value: unknown) => { success: boolean };
            };
        };

        expect(
            validators.LCNConnectionPromptActionResultValidator?.safeParse({
                promptId: '00000000-0000-4000-8000-000000000001',
                status: 'STALE',
            }).success
        ).toBe(true);
        expect(
            validators.LCNConnectionPromptValidator?.safeParse({
                promptId: '00000000-0000-4000-8000-000000000001',
                status: 'STALE',
                surface: 'POST_CLAIM',
                triggerId: 'credential:claim-1',
                triggeredAt: '2026-08-20T12:00:00.000Z',
                updatedAt: '2026-08-20T12:00:00.000Z',
                counterpart: { profileId: 'usera' },
            }).success
        ).toBe(false);
    });

    it('validates typed connection prompt notification metadata', () => {
        const validator = (
            LearnCardTypes as unknown as {
                LCNNotificationMetadataValidator?: {
                    safeParse: (value: unknown) => { success: boolean };
                };
            }
        ).LCNNotificationMetadataValidator;

        expect(
            validator?.safeParse({
                connectionPrompt: {
                    promptId: '00000000-0000-4000-8000-000000000001',
                    counterpartProfileId: 'usera',
                },
                existingMetadata: true,
            }).success
        ).toBe(true);
    });
});

describe('credential claim connection prompts', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

        profileA = (await getProfileByProfileId('usera'))!;
        profileB = (await getProfileByProfileId('userb'))!;
        profileC = (await getProfileByProfileId('userc'))!;
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
    });

    it('creates independent claimer and sender prompts for one claim', async () => {
        const created = await createPrompts('credential:claim-1');

        expect(created.claimerPrompt?.surface).toBe('POST_CLAIM');
        expect(created.senderPrompt?.surface).toBe('NOTIFICATION');
        const [claimerPrompt] = await getPendingConnectionPrompts(profileB);

        expect(claimerPrompt).toBeDefined();
        expect(claimerPrompt?.counterpart).not.toHaveProperty('did');
        expect(claimerPrompt?.counterpart).not.toHaveProperty('bio');
        expect(claimerPrompt?.counterpart).not.toHaveProperty('email');
        const [senderPrompt] = await getPendingConnectionPrompts(profileA);
        expect(senderPrompt).toBeDefined();
        expect(senderPrompt).not.toHaveProperty('notificationDelivered');
        expect(senderPrompt).not.toHaveProperty('coveredTriggerIds');
    });

    it('returns pending prompts oldest-first from both the helper and authenticated route', async () => {
        await createPrompts('credential:older');
        await createConnectionPromptsForClaim({
            claimer: profileB,
            sender: profileC,
            triggerId: 'credential:newer',
        });
        await neogma.queryRunner.run(
            `
                MATCH (:Profile { profileId: $viewerId })
                      -[prompt:CONNECTION_PROMPT]->
                      (counterpart:Profile)
                SET prompt.triggeredAt = CASE counterpart.profileId
                    WHEN $olderCounterpartId THEN $olderAt
                    ELSE $newerAt
                END
            `,
            {
                viewerId: profileB.profileId,
                olderCounterpartId: profileA.profileId,
                olderAt: '2026-08-20T10:00:00.000Z',
                newerAt: '2026-08-20T11:00:00.000Z',
            }
        );

        expect(
            (await getPendingConnectionPrompts(profileB)).map(
                prompt => prompt.counterpart.profileId
            )
        ).toEqual(['usera', 'userc']);
        expect(
            (await userB.clients.fullAuth.profile.pendingConnectionPrompts()).map(
                prompt => prompt.counterpart.profileId
            )
        ).toEqual(['usera', 'userc']);
    });

    it('uses prompt id as the stable oldest-first tie-breaker in helper and route results', async () => {
        await createPrompts('credential:tie-a');
        await createConnectionPromptsForClaim({
            claimer: profileB,
            sender: profileC,
            triggerId: 'credential:tie-c',
        });
        const tiedAt = '2026-08-20T10:00:00.000Z';
        await neogma.queryRunner.run(
            `
                MATCH (:Profile { profileId: $viewerId })
                      -[prompt:CONNECTION_PROMPT]->
                      (counterpart:Profile)
                SET prompt.triggeredAt = $tiedAt,
                    prompt.promptId = CASE counterpart.profileId
                        WHEN $firstCounterpartId THEN $firstPromptId
                        ELSE $secondPromptId
                    END
            `,
            {
                viewerId: profileB.profileId,
                tiedAt,
                firstCounterpartId: profileA.profileId,
                firstPromptId: '11111111-1111-4111-8111-111111111111',
                secondPromptId: '22222222-2222-4222-8222-222222222222',
            }
        );

        expect(
            (await getPendingConnectionPrompts(profileB)).map(
                prompt => prompt.counterpart.profileId
            )
        ).toEqual(['usera', 'userc']);
        expect(
            (await userB.clients.fullAuth.profile.pendingConnectionPrompts()).map(
                prompt => prompt.counterpart.profileId
            )
        ).toEqual(['usera', 'userc']);
    });

    const acquireOrderedPairGate = async (): Promise<() => Promise<void>> => {
        const session = neogma.queryRunner.getDriver().session();
        const transaction = session.beginTransaction();

        await transaction.run(
            `
                MATCH (first:Profile { profileId: $firstId })
                SET first.__connectionPromptPairLock =
                    coalesce(first.__connectionPromptPairLock, 0) + 1
            `,
            { firstId: [profileA.profileId, profileB.profileId].sort()[0] }
        );

        return async () => {
            await transaction.commit();
            await session.close();
        };
    };

    const waitForBlockedTransaction = async (queryMarker: string): Promise<boolean> => {
        for (let attempt = 0; attempt < 200; attempt += 1) {
            const result = await neogma.queryRunner.run(
                `
                    SHOW TRANSACTIONS YIELD currentQuery, status
                    WHERE currentQuery CONTAINS $queryMarker
                      AND status STARTS WITH 'Blocked by:'
                    RETURN count(*) AS count
                `,
                { queryMarker }
            );
            if (Number(result.records[0]?.get('count')) >= 1) return true;
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return false;
    };

    const countPairRelationships = async (): Promise<{
        blocked: number;
        connected: number;
    }> => {
        const result = await neogma.queryRunner.run(
            `
                MATCH (a:Profile { profileId: $aId }), (b:Profile { profileId: $bId })
                OPTIONAL MATCH (a)-[blocked:BLOCKED]-(b)
                WITH a, b, count(DISTINCT blocked) AS blocked
                OPTIONAL MATCH (a)-[connected:CONNECTED_WITH]-(b)
                RETURN blocked, count(DISTINCT connected) AS connected
            `,
            { aId: profileA.profileId, bId: profileB.profileId }
        );

        return {
            blocked: Number(result.records[0]?.get('blocked')),
            connected: Number(result.records[0]?.get('connected')),
        };
    };

    it.each([['prompt connect', 'block'] as const, ['block', 'prompt connect'] as const])(
        'serializes concurrent %s before %s without leaving blocked and connected relationships',
        async firstOperation => {
            const created = await createPrompts(`credential:race-${firstOperation}`);
            const connect = () =>
                connectWithConnectionPrompt(profileB, created.claimerPrompt!.promptId);
            const block = () => blockProfile(profileA, profileB);
            let firstPromise: Promise<unknown> | undefined;
            let secondPromise: Promise<unknown> | undefined;
            let releaseGate: (() => Promise<void>) | undefined;
            let gateReleased = false;

            try {
                releaseGate = await acquireOrderedPairGate();
                firstPromise = firstOperation === 'prompt connect' ? connect() : block();
                expect(
                    await waitForBlockedTransaction(
                        firstOperation === 'prompt connect'
                            ? 'shouldNotify'
                            : 'MERGE (source)-[:BLOCKED]->(target)'
                    )
                ).toBe(true);
                await releaseGate();
                gateReleased = true;
                secondPromise = firstOperation === 'prompt connect' ? block() : connect();
                const settled = await Promise.allSettled([firstPromise, secondPromise]);
                const rejected = settled.filter(
                    (result): result is PromiseRejectedResult => result.status === 'rejected'
                );
                expect(rejected.map(result => String(result.reason))).toEqual([]);
                const fulfilled = settled.filter(
                    (result): result is PromiseFulfilledResult<unknown> =>
                        result.status === 'fulfilled'
                );
                expect(fulfilled).toHaveLength(2);
                if (fulfilled.length !== 2) return;

                const [firstResult, secondResult] = fulfilled.map(result => result.value);
                const connectResult =
                    firstOperation === 'prompt connect' ? firstResult : secondResult;

                expect(await countPairRelationships()).toEqual({ blocked: 1, connected: 0 });
                expect(connectResult).toMatchObject({
                    status: firstOperation === 'prompt connect' ? 'CONNECTED' : 'SKIPPED',
                });
                await expect(
                    getConnectionPromptStatus(profileB, created.claimerPrompt!.promptId)
                ).resolves.toMatchObject({ status: 'SKIPPED' });
            } finally {
                if (!gateReleased && releaseGate) await releaseGate();
                await Promise.allSettled([firstPromise, secondPromise].filter(Boolean));
            }
        }
    );

    type AutomaticWriter = 'single' | 'bulk';

    const runAutomaticWriter = async (
        writer: AutomaticWriter,
        sourceKey = 'boost:auto-connect-test'
    ): Promise<void> => {
        if (writer === 'single') {
            await ensureMutualConnectionWithSource(
                profileA.profileId,
                profileB.profileId,
                sourceKey
            );
            return;
        }

        await ensureMutualConnectionsForRows(profileA.profileId, [
            { boostId: sourceKey.replace(/^boost:/, ''), targetId: profileB.profileId },
        ]);
    };

    const getPairConnectionSources = async (): Promise<string[][]> => {
        const result = await neogma.queryRunner.run(
            `
                MATCH (:Profile { profileId: $aId })
                      -[connection:CONNECTED_WITH]-
                      (:Profile { profileId: $bId })
                RETURN connection.sources AS sources
                ORDER BY sources
            `,
            { aId: profileA.profileId, bId: profileB.profileId }
        );

        return result.records.map(record => record.get('sources') as string[]);
    };

    it.each<AutomaticWriter>(['single', 'bulk'])(
        '%s automatic writer refuses a sequentially blocked pair',
        async writer => {
            await blockProfile(profileA, profileB);

            await runAutomaticWriter(writer);

            expect(await countPairRelationships()).toEqual({ blocked: 1, connected: 0 });
        }
    );

    it.each<AutomaticWriter>(['single', 'bulk'])(
        '%s automatic writer preserves its source and resolves existing pair prompts',
        async writer => {
            const created = await createPrompts(`credential:auto-${writer}`);

            await runAutomaticWriter(writer);

            expect(await getPairConnectionSources()).toEqual([
                ['boost:auto-connect-test'],
                ['boost:auto-connect-test'],
            ]);
            await expect(
                getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
            ).resolves.toMatchObject({ status: 'CONNECTED' });
            await expect(
                getConnectionPromptStatus(profileB, created.claimerPrompt!.promptId)
            ).resolves.toMatchObject({ status: 'CONNECTED' });
        }
    );

    it.each<AutomaticWriter>(['single', 'bulk'])(
        '%s automatic writer cannot reconnect after Block and Block removes an earlier automatic connection',
        async writer => {
            await runAutomaticWriter(writer, `boost:${writer}-first`);
            await blockProfile(profileA, profileB);
            expect(await countPairRelationships()).toEqual({ blocked: 1, connected: 0 });

            await runAutomaticWriter(writer, `boost:${writer}-after-block`);
            expect(await countPairRelationships()).toEqual({ blocked: 1, connected: 0 });
        }
    );

    it('groups repeated automatic rows by pair and bounds independent pair transactions', async () => {
        const targets = Array.from(
            { length: 30 },
            (_, index) => `load-target-${String(index).padStart(2, '0')}`
        );
        const rows = targets.flatMap(targetId => [
            { boostId: 'boost-c', targetId },
            { boostId: 'boost-a', targetId },
            { boostId: 'boost-b', targetId },
            { boostId: 'boost-a', targetId },
        ]);
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        let releaseQueries: (() => void) | undefined;
        const queryGate = new Promise<void>(resolve => {
            releaseQueries = resolve;
        });
        const groupedCalls: Array<Record<string, unknown>> = [];
        let active = 0;
        let maximumConcurrency = 0;
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (
                    typeof query === 'string' &&
                    query.includes('MERGE (a)-[r:CONNECTED_WITH]') &&
                    params?.aId === profileA.profileId
                ) {
                    groupedCalls.push(params);
                    active += 1;
                    maximumConcurrency = Math.max(maximumConcurrency, active);
                    await queryGate;

                    try {
                        return await originalRun(query, params);
                    } finally {
                        active -= 1;
                    }
                }

                return originalRun(query, params);
            });
        const operation = ensureMutualConnectionsForRows(profileA.profileId, rows);

        try {
            // Worker startup is synchronous until each worker reaches its first query, so this
            // measures configured fan-out without relying on wall-clock sleeps.
            expect(groupedCalls).toHaveLength(8);
            releaseQueries?.();
            await operation;

            expect(groupedCalls).toHaveLength(targets.length);
            expect(maximumConcurrency).toBeGreaterThan(1);
            expect(maximumConcurrency).toBeLessThanOrEqual(8);
            expect(groupedCalls.map(call => call.bId)).toEqual(targets);
            expect(groupedCalls.map(call => call.firstId)).toEqual(
                targets.map(targetId => [profileA.profileId, targetId].sort()[0])
            );
            expect(groupedCalls.every(call => Array.isArray(call.keys))).toBe(true);
            expect(
                groupedCalls.every(
                    call =>
                        (call.keys as string[]).join(',') ===
                        'boost:boost-a,boost:boost-b,boost:boost-c'
                )
            ).toBe(true);
        } finally {
            releaseQueries?.();
            await operation.catch(() => undefined);
            queryRunnerSpy.mockRestore();
        }
    });

    it.each([
        ['single', 'automatic connection'] as const,
        ['single', 'block'] as const,
        ['bulk', 'automatic connection'] as const,
        ['bulk', 'block'] as const,
    ])(
        'serializes concurrent %s writer with %s first and leaves a blocked-only pair',
        async (writer, firstOperation) => {
            let firstPromise: Promise<unknown> | undefined;
            let secondPromise: Promise<unknown> | undefined;
            let releaseGate: (() => Promise<void>) | undefined;
            let gateReleased = false;

            try {
                releaseGate = await acquireOrderedPairGate();
                firstPromise =
                    firstOperation === 'automatic connection'
                        ? runAutomaticWriter(writer)
                        : blockProfile(profileA, profileB);
                expect(
                    await waitForBlockedTransaction(
                        firstOperation === 'automatic connection'
                            ? 'SET first.__connectionPromptPairLock'
                            : 'MERGE (source)-[:BLOCKED]->(target)'
                    )
                ).toBe(true);
                await releaseGate();
                gateReleased = true;
                secondPromise =
                    firstOperation === 'automatic connection'
                        ? blockProfile(profileA, profileB)
                        : runAutomaticWriter(writer);

                await expect(Promise.all([firstPromise, secondPromise])).resolves.toBeDefined();
                expect(await countPairRelationships()).toEqual({ blocked: 1, connected: 0 });
            } finally {
                if (!gateReleased && releaseGate) await releaseGate();
                await Promise.allSettled([firstPromise, secondPromise].filter(Boolean));
            }
        }
    );

    it.each([
        ['prompt creation', 'block'] as const,
        ['block', 'prompt creation'] as const,
        ['prompt creation', 'connect'] as const,
        ['connect', 'prompt creation'] as const,
    ])('serializes concurrent %s before %s', async (firstOperation, secondOperation) => {
        const create = () => createPrompts(`credential:create-race-${firstOperation}`);
        const connect = () => connectProfiles(profileA, profileB, false);
        const block = () => blockProfile(profileA, profileB);
        const operation = (name: string): Promise<unknown> => {
            if (name === 'prompt creation') return create();
            if (name === 'connect') return connect();
            return block();
        };
        let firstPromise: Promise<unknown> | undefined;
        let secondPromise: Promise<unknown> | undefined;
        let releaseGate: (() => Promise<void>) | undefined;
        let gateReleased = false;

        try {
            releaseGate = await acquireOrderedPairGate();
            firstPromise = operation(firstOperation);
            expect(
                await waitForBlockedTransaction(
                    firstOperation === 'prompt creation'
                        ? 'SET first.__connectionPromptPairLock'
                        : firstOperation === 'block'
                        ? 'MERGE (source)-[:BLOCKED]->(target)'
                        : 'RETURN NOT isBlocked AS connected'
                )
            ).toBe(true);
            await releaseGate();
            gateReleased = true;
            secondPromise = operation(secondOperation);
            const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise]);
            const creationResult = (
                firstOperation === 'prompt creation' ? firstResult : secondResult
            ) as Awaited<ReturnType<typeof createPrompts>>;

            expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
            expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
            if (firstOperation === 'prompt creation') {
                expect(creationResult.claimerPrompt?.promptId).toEqual(expect.any(String));
            } else {
                expect(creationResult).toEqual({});
            }
        } finally {
            if (!gateReleased && releaseGate) await releaseGate();
            await Promise.allSettled([firstPromise, secondPromise].filter(Boolean));
        }
    });

    it.each([
        ['credential:same-trigger', 'credential:same-trigger'] as const,
        ['credential:first-trigger', 'credential:later-trigger'] as const,
    ])('serializes concurrent same-pair claims %s and %s', async (firstTrigger, secondTrigger) => {
        let firstPromise: Promise<Awaited<ReturnType<typeof createPrompts>>> | undefined;
        let secondPromise: Promise<Awaited<ReturnType<typeof createPrompts>>> | undefined;
        let releaseGate: (() => Promise<void>) | undefined;
        let gateReleased = false;

        try {
            releaseGate = await acquireOrderedPairGate();
            firstPromise = createPrompts(firstTrigger);
            expect(await waitForBlockedTransaction('SET first.__connectionPromptPairLock')).toBe(
                true
            );
            await releaseGate();
            gateReleased = true;
            secondPromise = createPrompts(secondTrigger);
            const [first, second] = await Promise.all([firstPromise, secondPromise]);

            expect(second.claimerPrompt?.promptId).toBe(first.claimerPrompt?.promptId);
            expect(second.senderPrompt?.promptId).toBe(first.senderPrompt?.promptId);
            expect([first.claimerPrompt?.isNew, second.claimerPrompt?.isNew].sort()).toEqual([
                false,
                true,
            ]);
            expect(await getPendingConnectionPrompts(profileA)).toHaveLength(1);
            await expect(getPendingConnectionPrompts(profileB)).resolves.toMatchObject([
                { triggerId: firstTrigger },
            ]);
            const coveredResult = await neogma.queryRunner.run(
                `
                    MATCH (:Profile { profileId: $aId })-[prompt:CONNECTION_PROMPT]-
                          (:Profile { profileId: $bId })
                    RETURN prompt.coveredTriggerIds AS coveredTriggerIds
                `,
                { aId: profileA.profileId, bId: profileB.profileId }
            );
            const expectedCoveredTriggers = [...new Set([firstTrigger, secondTrigger])];
            expect(
                coveredResult.records.map(record => record.get('coveredTriggerIds') as string[])
            ).toEqual([expectedCoveredTriggers, expectedCoveredTriggers]);
        } finally {
            if (!gateReleased && releaseGate) await releaseGate();
            await Promise.allSettled([firstPromise, secondPromise].filter(Boolean));
        }
    });

    const getSenderPromptDeliveryState = async (): Promise<{
        promptId: string;
        status: string;
        delivered: boolean;
        attemptToken: string | null;
        attemptedAt: string | null;
        mayHaveSucceeded: boolean;
    }> => {
        const result = await neogma.queryRunner.run(
            `
                MATCH (:Profile { profileId: $senderId })
                      -[prompt:CONNECTION_PROMPT]->
                      (:Profile { profileId: $claimerId })
                RETURN prompt.promptId AS promptId,
                       prompt.status AS status,
                       coalesce(prompt.notificationDelivered, false) AS delivered,
                       prompt.notificationDeliveryAttemptToken AS attemptToken,
                       prompt.notificationDeliveryAttemptedAt AS attemptedAt,
                       coalesce(prompt.notificationDeliveryMayHaveSucceeded, false)
                           AS mayHaveSucceeded
            `,
            { senderId: profileA.profileId, claimerId: profileB.profileId }
        );
        const record = result.records[0]!;

        return {
            promptId: record.get('promptId') as string,
            status: record.get('status') as string,
            delivered: record.get('delivered') as boolean,
            attemptToken: record.get('attemptToken') as string | null,
            attemptedAt: record.get('attemptedAt') as string | null,
            mayHaveSucceeded: record.get('mayHaveSucceeded') as boolean,
        };
    };

    const handleClaim = (triggerId: string) =>
        handleConnectionPromptsForCredentialClaim({
            claimer: profileB,
            sender: profileA,
            triggerId,
            vcUris: [`lc:network:credential:${triggerId}`],
        });

    it('allows only one concurrent same-trigger handler to own sender prompt delivery', async () => {
        const triggerId = 'credential:concurrent-delivery-owner';
        let releaseFirstEnqueue: (() => void) | undefined;
        let signalFirstEnqueue: (() => void) | undefined;
        const firstEnqueueStarted = new Promise<void>(resolve => {
            signalFirstEnqueue = resolve;
        });
        const firstEnqueueGate = new Promise<void>(resolve => {
            releaseFirstEnqueue = resolve;
        });
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockImplementationOnce(async () => {
                signalFirstEnqueue?.();
                await firstEnqueueGate;
            })
            .mockRejectedValueOnce(new Error('a second owner must never enqueue'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        let firstHandler: ReturnType<typeof handleClaim> | undefined;

        try {
            firstHandler = handleClaim(triggerId);
            await firstEnqueueStarted;
            const secondResult = await handleClaim(triggerId);
            releaseFirstEnqueue?.();
            await firstHandler;

            expect(notificationSpy).toHaveBeenCalledTimes(1);
            expect(secondResult).not.toHaveProperty('senderNotificationFailed');
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: true,
                attemptToken: null,
                attemptedAt: null,
            });
        } finally {
            releaseFirstEnqueue?.();
            if (firstHandler) await firstHandler;
            consoleErrorSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    it('keeps a fresh delivery owner exclusive and reclaims its stale lease', async () => {
        const triggerId = 'credential:stale-delivery-owner';
        const committed = await createPrompts(triggerId);
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined);

        await neogma.queryRunner.run(
            `
                MATCH (:Profile { profileId: $senderId })
                      -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                      (:Profile)
                SET prompt.notificationDeliveryAttemptToken = $attemptToken,
                    prompt.notificationDeliveryAttemptedAt = $attemptedAt
            `,
            {
                senderId: profileA.profileId,
                promptId: committed.senderPrompt!.promptId,
                attemptToken: 'crashed-owner',
                attemptedAt: new Date().toISOString(),
            }
        );

        try {
            await handleClaim(triggerId);
            expect(notificationSpy).not.toHaveBeenCalled();
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: false,
            });
            const [publicPrompt] = await getPendingConnectionPrompts(profileA);
            expect(publicPrompt).not.toHaveProperty('notificationDeliveryAttemptToken');
            expect(publicPrompt).not.toHaveProperty('notificationDeliveryAttemptedAt');
            expect(publicPrompt).not.toHaveProperty('notificationDeliveryMayHaveSucceeded');

            await neogma.queryRunner.run(
                `
                    MATCH ()-[prompt:CONNECTION_PROMPT { promptId: $promptId }]->()
                    SET prompt.notificationDeliveryAttemptedAt = $attemptedAt
                `,
                {
                    promptId: committed.senderPrompt!.promptId,
                    attemptedAt: new Date(0).toISOString(),
                }
            );

            await handleClaim(triggerId);
            expect(notificationSpy).toHaveBeenCalledTimes(1);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: true,
                attemptToken: null,
                attemptedAt: null,
            });
        } finally {
            notificationSpy.mockRestore();
        }
    });

    it('keeps delivery ownership persistence failure nonfatal', async () => {
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined);
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (typeof query === 'string' && query.includes('AS canClaim')) {
                    throw new Error('injected delivery ownership write failure');
                }

                return originalRun(query, params);
            });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            await expect(handleClaim('credential:ownership-write-failure')).resolves.toMatchObject({
                senderPrompt: { isNew: true },
            });
            expect(notificationSpy).not.toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
            queryRunnerSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    it('delivers an undelivered same-trigger sender prompt after a crash between commit and enqueue', async () => {
        const triggerId = 'credential:crash-before-enqueue';
        const committed = await createPrompts(triggerId);
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined);

        try {
            const recovered = await handleClaim(triggerId);

            expect(recovered.senderPrompt?.promptId).toBe(committed.senderPrompt?.promptId);
            expect(notificationSpy).toHaveBeenCalledTimes(1);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                promptId: committed.senderPrompt?.promptId,
                status: 'PENDING',
                delivered: true,
            });
        } finally {
            notificationSpy.mockRestore();
        }
    });

    it('keeps an SQS-queued sender prompt unacknowledged for the worker', async () => {
        const triggerId = 'credential:queued-for-worker';
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue({ MessageId: 'queued-message-id' } as any);

        try {
            await expect(handleClaim(triggerId)).resolves.toMatchObject({
                senderPrompt: { isNew: true },
            });
            expect(notificationSpy).toHaveBeenCalledOnce();
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: false,
                attemptToken: expect.any(String),
                attemptedAt: expect.any(String),
                mayHaveSucceeded: false,
            });
        } finally {
            notificationSpy.mockRestore();
        }
    });

    it('does not deliver a different trigger while an earlier sender prompt remains pending', async () => {
        const committed = await createPrompts('credential:pending-original-trigger');
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined);

        try {
            const later = await handleClaim('credential:different-trigger');

            expect(later.senderPrompt?.promptId).toBe(committed.senderPrompt?.promptId);
            expect(notificationSpy).not.toHaveBeenCalled();
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                promptId: committed.senderPrompt?.promptId,
                status: 'PENDING',
                delivered: false,
            });
        } finally {
            notificationSpy.mockRestore();
        }
    });

    it('treats a resolved false transport result as a definitive rejection', async () => {
        const triggerId = 'credential:resolved-false';
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(false);

        try {
            await expect(handleClaim(triggerId)).resolves.toMatchObject({
                senderNotificationFailed: true,
            });
            expect(notificationSpy).toHaveBeenCalledOnce();
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'SKIPPED',
                delivered: false,
                attemptToken: null,
                attemptedAt: null,
                mayHaveSucceeded: false,
            });
        } finally {
            notificationSpy.mockRestore();
        }
    });

    it('keeps an ambiguous timeout retryable without marking the prompt delivered', async () => {
        const triggerId = 'credential:ambiguous-timeout';
        let simulatedTransportAcceptance = false;
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockImplementationOnce(async () => {
                simulatedTransportAcceptance = true;
                throw new Error('timeout after transport acceptance');
            })
            .mockResolvedValueOnce(true);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            await expect(handleClaim(triggerId)).resolves.not.toHaveProperty(
                'senderNotificationFailed'
            );
            expect(simulatedTransportAcceptance).toBe(true);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: false,
                attemptToken: null,
                attemptedAt: null,
                mayHaveSucceeded: true,
            });

            await expect(handleClaim(triggerId)).resolves.not.toHaveProperty(
                'senderNotificationFailed'
            );
            expect(notificationSpy).toHaveBeenCalledTimes(2);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: true,
                attemptToken: null,
                attemptedAt: null,
                mayHaveSucceeded: false,
            });
        } finally {
            consoleErrorSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    it('keeps a prompt pending when retry rejects after an earlier enqueue acknowledgement write fails', async () => {
        const triggerId = 'credential:uncertain-after-ack-write-failure';
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(false);
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        let failAcknowledgement = true;
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (
                    failAcknowledgement &&
                    typeof query === 'string' &&
                    query.includes('notificationDelivered = true')
                ) {
                    failAcknowledgement = false;
                    throw new Error('injected acknowledgement write failure');
                }

                return originalRun(query, params);
            });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            await handleClaim(triggerId);
            await expect(handleClaim(triggerId)).resolves.toMatchObject({
                senderNotificationFailed: true,
            });

            expect(notificationSpy).toHaveBeenCalledTimes(2);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: false,
                attemptToken: null,
                attemptedAt: null,
                mayHaveSucceeded: true,
            });
        } finally {
            consoleErrorSpy.mockRestore();
            queryRunnerSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    it('keeps a prompt pending when a stale owner may have enqueued before its rejecting takeover', async () => {
        const triggerId = 'credential:uncertain-stale-takeover';
        let releaseFirstAcknowledgement: (() => void) | undefined;
        let signalFirstAcknowledgement: (() => void) | undefined;
        const firstAcknowledgementStarted = new Promise<void>(resolve => {
            signalFirstAcknowledgement = resolve;
        });
        const firstAcknowledgementGate = new Promise<void>(resolve => {
            releaseFirstAcknowledgement = resolve;
        });
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(false);
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        let holdFirstAcknowledgement = true;
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (
                    holdFirstAcknowledgement &&
                    typeof query === 'string' &&
                    query.includes('notificationDelivered = true')
                ) {
                    holdFirstAcknowledgement = false;
                    signalFirstAcknowledgement?.();
                    await firstAcknowledgementGate;
                }

                return originalRun(query, params);
            });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        let firstHandler: ReturnType<typeof handleClaim> | undefined;

        try {
            firstHandler = handleClaim(triggerId);
            await firstAcknowledgementStarted;

            await originalRun(
                `
                    MATCH ()-[prompt:CONNECTION_PROMPT]->()
                    WHERE prompt.triggerId = $triggerId
                      AND prompt.notificationDeliveryAttemptToken IS NOT NULL
                    SET prompt.notificationDeliveryAttemptedAt = $attemptedAt
                `,
                { triggerId, attemptedAt: new Date(0).toISOString() }
            );

            await expect(handleClaim(triggerId)).resolves.toMatchObject({
                senderNotificationFailed: true,
            });
            releaseFirstAcknowledgement?.();
            await firstHandler;

            expect(notificationSpy).toHaveBeenCalledTimes(2);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: false,
                attemptToken: null,
                attemptedAt: null,
                mayHaveSucceeded: true,
            });
        } finally {
            releaseFirstAcknowledgement?.();
            if (firstHandler) await firstHandler;
            consoleErrorSpy.mockRestore();
            queryRunnerSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    it('retries delivery after enqueue succeeds but acknowledgement persistence fails', async () => {
        const triggerId = 'credential:ack-write-failure';
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined);
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        let failAcknowledgement = true;
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (
                    failAcknowledgement &&
                    typeof query === 'string' &&
                    query.includes('notificationDelivered = true')
                ) {
                    failAcknowledgement = false;
                    throw new Error('injected acknowledgement write failure');
                }

                return originalRun(query, params);
            });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            await expect(handleClaim(triggerId)).resolves.toMatchObject({
                senderPrompt: { isNew: true },
            });
            expect(await getSenderPromptDeliveryState()).toMatchObject({ delivered: false });

            await expect(handleClaim(triggerId)).resolves.toMatchObject({
                senderPrompt: { isNew: false },
            });
            expect(notificationSpy).toHaveBeenCalledTimes(2);
            expect(await getSenderPromptDeliveryState()).toMatchObject({ delivered: true });
        } finally {
            consoleErrorSpy.mockRestore();
            queryRunnerSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    it('retries a rejected enqueue when conditional sender-prompt recovery also fails', async () => {
        const triggerId = 'credential:enqueue-and-recovery-failure';
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(undefined);
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        let failRecovery = true;
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (
                    failRecovery &&
                    typeof query === 'string' &&
                    query.includes("SET prompt.status = 'SKIPPED'")
                ) {
                    failRecovery = false;
                    throw new Error('injected recovery write failure');
                }

                return originalRun(query, params);
            });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            await expect(handleClaim(triggerId)).resolves.toMatchObject({
                senderNotificationFailed: true,
            });
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: false,
            });

            await expect(handleClaim(triggerId)).resolves.not.toHaveProperty(
                'senderNotificationFailed'
            );
            expect(notificationSpy).toHaveBeenCalledTimes(2);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                status: 'PENDING',
                delivered: true,
            });
        } finally {
            consoleErrorSpy.mockRestore();
            queryRunnerSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    it('does not redeliver an acknowledged sender prompt for the same trigger', async () => {
        const triggerId = 'credential:acknowledged';
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined);

        try {
            await handleClaim(triggerId);
            expect(await getSenderPromptDeliveryState()).toMatchObject({ delivered: true });

            await handleClaim(triggerId);
            expect(notificationSpy).toHaveBeenCalledTimes(1);
        } finally {
            notificationSpy.mockRestore();
        }
    });

    it('reopens a rejected sender prompt for a distinct trigger and acknowledges its delivery', async () => {
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(undefined);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            const first = await handleClaim('credential:rejected-first');
            expect(await getSenderPromptDeliveryState()).toMatchObject({ status: 'SKIPPED' });

            const later = await handleClaim('credential:reopened-later');
            expect(later.senderPrompt?.promptId).not.toBe(first.senderPrompt?.promptId);
            expect(notificationSpy).toHaveBeenCalledTimes(2);
            expect(await getSenderPromptDeliveryState()).toMatchObject({
                promptId: later.senderPrompt?.promptId,
                status: 'PENDING',
                delivered: true,
            });
        } finally {
            consoleErrorSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });

    describe('authenticated profile routes', () => {
        it('requires full authentication for connection prompt reads and actions', async () => {
            const created = await createPrompts('credential:claim-1');
            const noAuthClient = getClient();

            await expect(noAuthClient.profile.pendingConnectionPrompts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.profile.connectionPromptStatus({
                    promptId: created.claimerPrompt!.promptId,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.partialAuth.profile.skipConnectionPrompt({
                    promptId: created.claimerPrompt!.promptId,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('lists only the authenticated viewer prompts with a public counterpart', async () => {
            await createPrompts('credential:claim-1');

            const pending = await userB.clients.fullAuth.profile.pendingConnectionPrompts();

            expect(pending).toHaveLength(1);
            expect(pending[0]?.counterpart.profileId).toBe(profileA.profileId);
            expect(pending[0]?.counterpart).not.toHaveProperty('did');
            expect(pending[0]?.counterpart).not.toHaveProperty('email');
        });

        it('skips only the authenticated viewer prompt', async () => {
            const created = await createPrompts('credential:claim-1');

            await expect(
                userB.clients.fullAuth.profile.skipConnectionPrompt({
                    promptId: created.claimerPrompt!.promptId,
                })
            ).resolves.toEqual({
                promptId: created.claimerPrompt!.promptId,
                status: 'SKIPPED',
            });
            await expect(
                userA.clients.fullAuth.profile.connectionPromptStatus({
                    promptId: created.senderPrompt!.promptId,
                })
            ).resolves.toMatchObject({ status: 'PENDING' });
        });

        it('does not let another viewer read, skip, or connect with a prompt id', async () => {
            const created = await createPrompts('credential:claim-1');
            const promptId = created.claimerPrompt!.promptId;

            await expect(
                userA.clients.fullAuth.profile.connectionPromptStatus({ promptId })
            ).resolves.toEqual({ promptId, status: 'STALE' });
            await expect(
                userA.clients.fullAuth.profile.connectWithConnectionPrompt({ promptId })
            ).resolves.toEqual({ promptId, status: 'STALE' });
            expect(await areProfilesConnected(profileA, profileB)).toBe(false);
            await expect(
                userA.clients.fullAuth.profile.skipConnectionPrompt({ promptId })
            ).resolves.toEqual({ promptId, status: 'STALE' });
            await expect(
                userB.clients.fullAuth.profile.connectionPromptStatus({ promptId })
            ).resolves.toEqual({ promptId, status: 'PENDING' });
        });

        it('reports an overwritten prompt id as stale', async () => {
            const first = await createPrompts('credential:claim-1');
            await userB.clients.fullAuth.profile.skipConnectionPrompt({
                promptId: first.claimerPrompt!.promptId,
            });
            const later = await createPrompts('credential:claim-2');

            expect(later.claimerPrompt?.promptId).not.toBe(first.claimerPrompt?.promptId);
            await expect(
                userB.clients.fullAuth.profile.connectionPromptStatus({
                    promptId: first.claimerPrompt!.promptId,
                })
            ).resolves.toEqual({
                promptId: first.claimerPrompt!.promptId,
                status: 'STALE',
            });
        });

        it('connects immediately from a prompt and resolves both directions', async () => {
            const created = await createPrompts('credential:claim-1');

            await expect(
                userA.clients.fullAuth.profile.connectWithConnectionPrompt({
                    promptId: created.senderPrompt!.promptId,
                })
            ).resolves.toEqual({
                promptId: created.senderPrompt!.promptId,
                status: 'CONNECTED',
            });
            expect(await areProfilesConnected(profileA, profileB)).toBe(true);
            await expect(
                userB.clients.fullAuth.profile.connectionPromptStatus({
                    promptId: created.claimerPrompt!.promptId,
                })
            ).resolves.toMatchObject({ status: 'CONNECTED' });
        });

        it('returns connected without creating another connection when already connected', async () => {
            const created = await createPrompts('credential:claim-1');
            await connectProfiles(profileA, profileB, false);

            const countConnectionEdges = async (): Promise<number> => {
                const result = await neogma.queryRunner.run(
                    `
                        MATCH (:Profile { profileId: $profileAId })
                              -[connection:CONNECTED_WITH]-
                              (:Profile { profileId: $profileBId })
                        RETURN count(connection) AS count
                    `,
                    { profileAId: profileA.profileId, profileBId: profileB.profileId }
                );

                return Number(result.records[0]?.get('count'));
            };

            expect(await countConnectionEdges()).toBe(2);
            await expect(
                userB.clients.fullAuth.profile.connectWithConnectionPrompt({
                    promptId: created.claimerPrompt!.promptId,
                })
            ).resolves.toEqual({
                promptId: created.claimerPrompt!.promptId,
                status: 'CONNECTED',
            });
            expect(await countConnectionEdges()).toBe(2);
        });
    });

    it('does not reopen a skipped prompt for the same trigger but reopens for a later claim', async () => {
        const first = await createPrompts('credential:claim-1');
        await skipConnectionPrompt(profileB, first.claimerPrompt!.promptId);

        await createPrompts('credential:claim-1');
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);

        const later = await createPrompts('credential:claim-2');
        expect(later.claimerPrompt?.promptId).not.toBe(first.claimerPrompt?.promptId);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(1);
    });

    it('keeps the counterpart prompt pending when one participant skips', async () => {
        const created = await createPrompts('credential:claim-1');

        await skipConnectionPrompt(profileB, created.claimerPrompt!.promptId);

        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(1);
    });

    it('preserves the pending prompt identity when another claim arrives', async () => {
        const first = await createPrompts('credential:claim-1');
        const repeated = await createPrompts('credential:claim-2');

        expect(repeated.claimerPrompt?.promptId).toBe(first.claimerPrompt?.promptId);
        expect(repeated.claimerPrompt?.isNew).toBe(false);
        expect(repeated.senderPrompt?.promptId).toBe(first.senderPrompt?.promptId);
        expect(repeated.senderPrompt?.isNew).toBe(false);
    });

    it('does not reopen either direction for a trigger covered while pending', async () => {
        const triggerA = 'credential:covered-a';
        const triggerB = 'credential:covered-b';
        const triggerC = 'credential:unseen-c';
        const first = await createPrompts(triggerA);
        const coalesced = await createPrompts(triggerB);

        expect(coalesced.claimerPrompt?.promptId).toBe(first.claimerPrompt?.promptId);
        expect(coalesced.senderPrompt?.promptId).toBe(first.senderPrompt?.promptId);
        const coveredResult = await neogma.queryRunner.run(
            `
                MATCH (:Profile { profileId: $aId })-[prompt:CONNECTION_PROMPT]-
                      (:Profile { profileId: $bId })
                RETURN prompt.promptId AS promptId,
                       prompt.coveredTriggerIds AS coveredTriggerIds
                ORDER BY prompt.promptId
            `,
            { aId: profileA.profileId, bId: profileB.profileId }
        );
        expect(
            coveredResult.records.map(record => record.get('coveredTriggerIds') as string[])
        ).toEqual([
            [triggerA, triggerB],
            [triggerA, triggerB],
        ]);

        await Promise.all([
            skipConnectionPrompt(profileB, first.claimerPrompt!.promptId),
            skipConnectionPrompt(profileA, first.senderPrompt!.promptId),
        ]);

        expect(await createPrompts(triggerB)).toEqual({});
        await expect(
            getConnectionPromptStatus(profileB, first.claimerPrompt!.promptId)
        ).resolves.toEqual({ promptId: first.claimerPrompt!.promptId, status: 'SKIPPED' });
        await expect(
            getConnectionPromptStatus(profileA, first.senderPrompt!.promptId)
        ).resolves.toEqual({ promptId: first.senderPrompt!.promptId, status: 'SKIPPED' });

        const reopened = await createPrompts(triggerC);
        expect(reopened.claimerPrompt?.promptId).not.toBe(first.claimerPrompt?.promptId);
        expect(reopened.senderPrompt?.promptId).not.toBe(first.senderPrompt?.promptId);
        const reopenedResult = await neogma.queryRunner.run(
            `
                MATCH (:Profile { profileId: $aId })-[prompt:CONNECTION_PROMPT]-
                      (:Profile { profileId: $bId })
                RETURN prompt.coveredTriggerIds AS coveredTriggerIds
                ORDER BY prompt.promptId
            `,
            { aId: profileA.profileId, bId: profileB.profileId }
        );
        expect(
            reopenedResult.records.map(record => record.get('coveredTriggerIds') as string[])
        ).toEqual([[triggerC], [triggerC]]);
    });

    it('does not create prompts for a claim sent to self', async () => {
        const result = await createConnectionPromptsForClaim({
            claimer: profileA,
            sender: profileA,
            triggerId: 'credential:self',
        });

        expect(result).toEqual({});
    });

    it('does not create prompts involving a service profile', async () => {
        await neogma.queryRunner.run(
            'MATCH (profile:Profile { profileId: $profileId }) SET profile.isServiceProfile = true',
            { profileId: profileA.profileId }
        );
        profileA = (await getProfileByProfileId('usera'))!;

        expect(await createPrompts('credential:service')).toEqual({});
    });

    it('does not create prompts for a blocked pair', async () => {
        await blockProfile(profileA, profileB);

        expect(await createPrompts('credential:blocked')).toEqual({});
    });

    it('does not create prompts for an already connected pair', async () => {
        await connectProfiles(profileA, profileB, false);

        expect(await createPrompts('credential:connected')).toEqual({});
    });

    it('reports an old prompt as stale after a later claim reopens the direction', async () => {
        const first = await createPrompts('credential:claim-1');
        await skipConnectionPrompt(profileB, first.claimerPrompt!.promptId);

        const later = await createPrompts('credential:claim-2');

        expect(later.claimerPrompt?.promptId).not.toBe(first.claimerPrompt?.promptId);
        await expect(
            getConnectionPromptStatus(profileB, first.claimerPrompt!.promptId)
        ).resolves.toEqual({
            promptId: first.claimerPrompt!.promptId,
            status: 'STALE',
        });
    });

    it('allows only one terminal action to win a connect and skip race', async () => {
        const created = await createPrompts('credential:claim-1');
        const promptId = created.claimerPrompt!.promptId;

        const results = await Promise.all([
            connectWithConnectionPrompt(profileB, promptId),
            skipConnectionPrompt(profileB, promptId),
        ]);

        expect(new Set(results.map(result => result.status))).toHaveLength(1);
        expect(['CONNECTED', 'SKIPPED']).toContain(results[0]!.status);
        await expect(getConnectionPromptStatus(profileB, promptId)).resolves.toEqual(results[0]);
    });

    it('connecting from a prompt resolves both directed prompts', async () => {
        const created = await createPrompts('credential:claim-1');

        await expect(
            connectWithConnectionPrompt(profileB, created.claimerPrompt!.promptId)
        ).resolves.toEqual({
            promptId: created.claimerPrompt!.promptId,
            status: 'CONNECTED',
        });

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
        await expect(
            getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
        ).resolves.toEqual({
            promptId: created.senderPrompt!.promptId,
            status: 'CONNECTED',
        });
    });

    it('rolls back connection edges when pair-wide prompt resolution fails', async () => {
        const created = await createPrompts('credential:claim-1');
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (
                    typeof query === 'string' &&
                    query.includes('CONNECTION_PROMPT') &&
                    params?.status === 'CONNECTED'
                ) {
                    throw new Error('prompt resolution fault');
                }

                return originalRun(query, params);
            });

        try {
            await expect(
                connectWithConnectionPrompt(profileB, created.claimerPrompt!.promptId)
            ).rejects.toThrow('prompt resolution fault');
        } finally {
            queryRunnerSpy.mockRestore();
        }

        expect(await areProfilesConnected(profileA, profileB)).toBe(false);
        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(1);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(1);
    });

    it('commits connection edges and both prompts before notification failure', async () => {
        const created = await createPrompts('credential:claim-1');
        const notificationSpy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockRejectedValueOnce(new Error('notification fault'));

        try {
            await expect(connectProfiles(profileB, profileA, false)).rejects.toThrow(
                'notification fault'
            );
        } finally {
            notificationSpy.mockRestore();
        }

        expect(await areProfilesConnected(profileA, profileB)).toBe(true);
        expect(
            await getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
        ).toMatchObject({ status: 'CONNECTED' });
        expect(
            await getConnectionPromptStatus(profileB, created.claimerPrompt!.promptId)
        ).toMatchObject({ status: 'CONNECTED' });
        await expect(
            connectWithConnectionPrompt(profileB, created.claimerPrompt!.promptId)
        ).resolves.toMatchObject({ status: 'CONNECTED' });
    });

    it('ordinary connection acceptance resolves both directed prompts permanently', async () => {
        const created = await createPrompts('credential:claim-1');

        await requestConnection(profileA, profileB);
        await connectProfiles(profileB, profileA);

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
        expect(
            await getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
        ).toMatchObject({ status: 'CONNECTED' });
        expect(
            await getConnectionPromptStatus(profileB, created.claimerPrompt!.promptId)
        ).toMatchObject({ status: 'CONNECTED' });

        await disconnectProfiles(profileA, profileB);

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
    });

    it('blocking skips both directed prompts and unblocking does not resurface them', async () => {
        const created = await createPrompts('credential:claim-1');

        await blockProfile(profileA, profileB);

        expect(
            await getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
        ).toMatchObject({ status: 'SKIPPED' });
        expect(
            await getConnectionPromptStatus(profileB, created.claimerPrompt!.promptId)
        ).toMatchObject({ status: 'SKIPPED' });

        await unblockProfile(profileA, profileB);

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
    });

    it('requires a new claim after disconnect or unblock to create another prompt instance', async () => {
        const connected = await createPrompts('credential:claim-1');
        await connectWithConnectionPrompt(profileB, connected.claimerPrompt!.promptId);
        await disconnectProfiles(profileA, profileB);

        const afterDisconnect = await createPrompts('credential:claim-2');
        expect(afterDisconnect.claimerPrompt?.promptId).not.toBe(connected.claimerPrompt?.promptId);

        await blockProfile(profileA, profileB);
        await unblockProfile(profileA, profileB);

        const afterUnblock = await createPrompts('credential:claim-3');
        expect(afterUnblock.claimerPrompt?.promptId).not.toBe(
            afterDisconnect.claimerPrompt?.promptId
        );
    });
});
