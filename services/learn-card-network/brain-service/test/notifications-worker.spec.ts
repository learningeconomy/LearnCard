import type { Context, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/serverless', async importOriginal => {
    const actual = await importOriginal<typeof import('@sentry/serverless')>();

    return {
        ...actual,
        AWSLambda: {
            ...actual.AWSLambda,
            init: vi.fn(),
            wrapHandler: <T>(handler: T): T => handler,
        },
    };
});

vi.mock('@helpers/skill-embedding.helpers', () => ({
    startSkillEmbeddingBackfill: vi.fn().mockResolvedValue(undefined),
}));

import { LCNNotification, LCNNotificationTypeEnumValidator } from '@learncard/types';
import { createConnectionPromptsForClaim } from '@helpers/connectionPrompt.helpers';
import * as LearnCardHelpers from '@helpers/learnCard.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { neogma } from '@instance';
import { Profile } from '@models';
import { ProfileType } from 'types/profile';

import { notificationsWorker } from '../lambda';
import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let profileA: ProfileType;
let profileB: ProfileType;

const notification = (
    title: string,
    connectionPrompt?: { promptId: string; counterpartProfileId: string }
): LCNNotification => ({
    type: LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED,
    to: {
        did: 'did:web:localhost%3A3000:users:usera',
        profileId: 'usera',
        notificationsWebhook: 'https://notifications.example/api/notifications/send',
    },
    from: {
        did: 'did:web:localhost%3A3000:users:userb',
        profileId: 'userb',
    },
    message: { title, body: `${title} body` },
    ...(connectionPrompt ? { data: { metadata: { connectionPrompt } } } : {}),
});

const record = (messageId: string, value: LCNNotification): SQSRecord => ({
    messageId,
    receiptHandle: `${messageId}-receipt`,
    body: JSON.stringify(value),
    attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '0',
        SenderId: 'test',
        ApproximateFirstReceiveTimestamp: '0',
    },
    messageAttributes: {},
    md5OfBody: 'test',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:notifications',
    awsRegion: 'us-east-1',
});

const invokeWorker = async (...records: SQSRecord[]): Promise<SQSBatchResponse> => {
    const event: SQSEvent = { Records: records };
    const result = await notificationsWorker(
        event,
        {
            functionName: 'notificationsWorker',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:test',
            memoryLimitInMB: '128',
            awsRequestId: 'test-request',
            logGroupName: 'test',
            logStreamName: 'test',
            callbackWaitsForEmptyEventLoop: false,
            getRemainingTimeInMillis: () => 30_000,
            done: vi.fn(),
            fail: vi.fn(),
            succeed: vi.fn(),
        } as Context,
        vi.fn()
    );

    return result as SQSBatchResponse;
};

const fetchResponse = (stored: boolean): Response =>
    ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(stored),
    } as Response);

const getSenderDeliveryState = async (): Promise<{
    delivered: boolean;
    attemptToken: string | null;
    attemptedAt: string | null;
    mayHaveSucceeded: boolean;
}> => {
    const result = await neogma.queryRunner.run(
        `
            MATCH (:Profile { profileId: 'usera' })-[prompt:CONNECTION_PROMPT]->(:Profile)
            RETURN coalesce(prompt.notificationDelivered, false) AS delivered,
                   prompt.notificationDeliveryAttemptToken AS attemptToken,
                   prompt.notificationDeliveryAttemptedAt AS attemptedAt,
                   coalesce(prompt.notificationDeliveryMayHaveSucceeded, false)
                       AS mayHaveSucceeded
        `
    );

    return result.records[0]!.toObject() as {
        delivered: boolean;
        attemptToken: string | null;
        attemptedAt: string | null;
        mayHaveSucceeded: boolean;
    };
};

describe('notifications SQS worker', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        profileA = (await getProfileByProfileId('usera'))!;
        profileB = (await getProfileByProfileId('userb'))!;
        vi.spyOn(LearnCardHelpers, 'getDidWebLearnCard').mockResolvedValue({
            invoke: { getDidAuthVp: async () => 'test-did-auth-vp' },
        } as any);
    });

    it('returns independent batch failures for downstream false and transport errors', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
            const body = JSON.parse(String(init?.body)) as LCNNotification;

            if (body.message?.title === 'not-stored') return fetchResponse(false);
            if (body.message?.title === 'transport-error') throw new Error('network failure');

            return fetchResponse(true);
        });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            await expect(
                invokeWorker(
                    record('not-stored-id', notification('not-stored')),
                    record('transport-error-id', notification('transport-error')),
                    record('stored-id', notification('stored'))
                )
            ).resolves.toEqual({
                batchItemFailures: [
                    { itemIdentifier: 'not-stored-id' },
                    { itemIdentifier: 'transport-error-id' },
                ],
            });
            expect(fetchSpy).toHaveBeenCalledTimes(3);
        } finally {
            consoleErrorSpy.mockRestore();
            fetchSpy.mockRestore();
        }
    });

    it('acknowledges a durably stored actionable notification despite a replaced attempt token', async () => {
        const created = await createConnectionPromptsForClaim({
            claimer: profileB,
            sender: profileA,
            triggerId: 'credential:worker-success',
        });
        await neogma.queryRunner.run(
            `
                MATCH ()-[prompt:CONNECTION_PROMPT { promptId: $promptId }]->()
                SET prompt.notificationDeliveryAttemptToken = 'replacement-owner',
                    prompt.notificationDeliveryAttemptedAt = $attemptedAt,
                    prompt.notificationDeliveryMayHaveSucceeded = true
            `,
            {
                promptId: created.senderPrompt!.promptId,
                attemptedAt: new Date().toISOString(),
            }
        );
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchResponse(true));

        try {
            await expect(
                invokeWorker(
                    record(
                        'stored-actionable-id',
                        notification('stored-actionable', {
                            promptId: created.senderPrompt!.promptId,
                            counterpartProfileId: profileB.profileId,
                        })
                    )
                )
            ).resolves.toEqual({ batchItemFailures: [] });
            await expect(getSenderDeliveryState()).resolves.toEqual({
                delivered: true,
                attemptToken: null,
                attemptedAt: null,
                mayHaveSucceeded: false,
            });
        } finally {
            fetchSpy.mockRestore();
        }
    });

    it('retries a graph acknowledgement failure and safely acknowledges the stored notification', async () => {
        const created = await createConnectionPromptsForClaim({
            claimer: profileB,
            sender: profileA,
            triggerId: 'credential:worker-ack-retry',
        });
        const queuedRecord = record(
            'ack-retry-id',
            notification('ack-retry', {
                promptId: created.senderPrompt!.promptId,
                counterpartProfileId: profileB.profileId,
            })
        );
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchResponse(true));
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                if (
                    typeof query === 'string' &&
                    query.includes('SET prompt.notificationDelivered = true')
                ) {
                    throw new Error('injected graph acknowledgement failure');
                }

                return originalRun(query, params);
            });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            await expect(invokeWorker(queuedRecord)).resolves.toEqual({
                batchItemFailures: [{ itemIdentifier: 'ack-retry-id' }],
            });
            await expect(getSenderDeliveryState()).resolves.toMatchObject({ delivered: false });

            queryRunnerSpy.mockRestore();

            await expect(invokeWorker(queuedRecord)).resolves.toEqual({ batchItemFailures: [] });
            await expect(getSenderDeliveryState()).resolves.toMatchObject({ delivered: true });
            expect(fetchSpy).toHaveBeenCalledTimes(2);
        } finally {
            consoleErrorSpy.mockRestore();
            queryRunnerSpy.mockRestore();
            fetchSpy.mockRestore();
        }
    });
});
