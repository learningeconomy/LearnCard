import { randomUUID } from 'crypto';

import {
    LCNConnectionPrompt,
    LCNConnectionPromptActionResult,
    LCNConnectionPromptActionResultValidator,
    LCNConnectionPromptSurface,
    LCNConnectionPromptValidator,
    LCNNotificationTypeEnumValidator,
    LCNPublicProfileValidator,
} from '@learncard/types';
import { neogma } from '@instance';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { inflateObject } from '@helpers/objects.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getNotificationMessage } from '@helpers/notificationMessages';
import { resolveRecipientLocale } from '@helpers/getRecipientLocale.helpers';
import { runConnectionPairQuery } from '@helpers/connectionPair.helpers';
import { FlatProfileType, ProfileType } from 'types/profile';

export type CreateConnectionPromptsForClaimInput = {
    claimer: ProfileType;
    sender: ProfileType;
    triggerId: string;
};

type PromptTransition = {
    promptId: string;
    surface: LCNConnectionPromptSurface;
    triggerId: string;
    isNew: boolean;
    notificationDelivered?: boolean;
};

export type ConnectionPromptCreationResult = {
    claimerPrompt?: PromptTransition;
    senderPrompt?: PromptTransition;
    senderNotificationFailed?: boolean;
};

type PromptCreationRow = {
    role: 'claimer' | 'sender';
    promptId: string;
    surface: LCNConnectionPromptSurface;
    triggerId: string;
    status: string;
    isNew: boolean;
    notificationDelivered: boolean;
};

type PromptStatusRow = {
    promptId: string;
    status: 'PENDING' | 'SKIPPED' | 'CONNECTED';
};

const SENDER_NOTIFICATION_ATTEMPT_LEASE_MS = 5 * 60 * 1000;

export const markConnectionPromptsSkipped = async (
    first: ProfileType,
    second: ProfileType
): Promise<void> => {
    await neogma.queryRunner.run(
        `
            MATCH (first:Profile { profileId: $firstProfileId })
            MATCH (second:Profile { profileId: $secondProfileId })
            MATCH (first)-[prompt:CONNECTION_PROMPT]-(second)
            SET prompt.status = 'SKIPPED', prompt.updatedAt = $updatedAt
        `,
        {
            firstProfileId: first.profileId,
            secondProfileId: second.profileId,
            updatedAt: new Date().toISOString(),
        }
    );
};

export const createConnectionPromptsForClaim = async (
    input: CreateConnectionPromptsForClaimInput
): Promise<ConnectionPromptCreationResult> => {
    if (input.claimer.profileId === input.sender.profileId) return {};

    const now = new Date().toISOString();
    const directions = [
        {
            role: 'claimer',
            viewerId: input.claimer.profileId,
            counterpartId: input.sender.profileId,
            promptId: randomUUID(),
            surface: 'POST_CLAIM',
        },
        {
            role: 'sender',
            viewerId: input.sender.profileId,
            counterpartId: input.claimer.profileId,
            promptId: randomUUID(),
            surface: 'NOTIFICATION',
        },
    ];

    const result = await runConnectionPairQuery(
        `
            MATCH (first:Profile { profileId: $firstId })
            SET first.__connectionPromptPairLock =
                coalesce(first.__connectionPromptPairLock, 0) + 1
            WITH first
            MATCH (claimer:Profile { profileId: $claimerId })
            MATCH (sender:Profile { profileId: $senderId })
            CALL {
                WITH claimer, sender
                WITH claimer, sender
                WHERE coalesce(claimer.isServiceProfile, false) = false
                  AND coalesce(sender.isServiceProfile, false) = false
                  AND NOT EXISTS { MATCH (claimer)-[:BLOCKED]-(sender) }
                  AND NOT EXISTS { MATCH (claimer)-[:CONNECTED_WITH]-(sender) }
                UNWIND $directions AS direction
                MATCH (viewer:Profile { profileId: direction.viewerId })
                MATCH (counterpart:Profile { profileId: direction.counterpartId })
                MERGE (viewer)-[prompt:CONNECTION_PROMPT]->(counterpart)
                WITH prompt, direction,
                     prompt.promptId IS NULL OR (
                         prompt.status <> 'PENDING' AND prompt.triggerId <> $triggerId
                     ) AS isNew
                FOREACH (_ IN CASE WHEN isNew THEN [1] ELSE [] END |
                    SET prompt.promptId = direction.promptId,
                        prompt.status = 'PENDING',
                        prompt.triggerId = $triggerId,
                        prompt.surface = direction.surface,
                        prompt.triggeredAt = $now,
                        prompt.updatedAt = $now,
                        prompt.notificationDelivered = CASE
                            WHEN direction.role = 'sender' THEN false
                            ELSE null
                        END,
                        prompt.notificationDeliveryAttemptToken = null,
                        prompt.notificationDeliveryAttemptedAt = null
                )
                RETURN collect({
                    role: direction.role,
                    promptId: prompt.promptId,
                    surface: prompt.surface,
                    triggerId: prompt.triggerId,
                    status: prompt.status,
                    isNew: isNew,
                    notificationDelivered: coalesce(prompt.notificationDelivered, false)
                }) AS rows
            }
            REMOVE first.__connectionPromptPairLock
            WITH rows
            UNWIND rows AS row
            RETURN row.role AS role,
                   row.promptId AS promptId,
                   row.surface AS surface,
                   row.triggerId AS triggerId,
                   row.status AS status,
                   row.isNew AS isNew,
                   row.notificationDelivered AS notificationDelivered
        `,
        {
            claimerId: input.claimer.profileId,
            senderId: input.sender.profileId,
            firstId: [input.claimer.profileId, input.sender.profileId].sort()[0],
            triggerId: input.triggerId,
            directions,
            now,
        }
    );

    const rows = convertQueryResultToPropertiesObjectArray<PromptCreationRow>(result);

    return rows.reduce<ConnectionPromptCreationResult>((creationResult, row) => {
        if (row.status !== 'PENDING') return creationResult;

        const transition: PromptTransition = {
            promptId: row.promptId,
            surface: row.surface,
            triggerId: row.triggerId,
            isNew: row.isNew,
            ...(row.role === 'sender' ? { notificationDelivered: row.notificationDelivered } : {}),
        };

        if (row.role === 'claimer') creationResult.claimerPrompt = transition;
        if (row.role === 'sender') creationResult.senderPrompt = transition;

        return creationResult;
    }, {});
};

const claimSenderPromptNotificationDelivery = async (
    viewer: ProfileType,
    counterpart: ProfileType,
    promptId: string,
    triggerId: string
): Promise<string | undefined> => {
    const attemptToken = randomUUID();
    const attemptedAt = new Date();
    const result = await runConnectionPairQuery(
        `
            MATCH (first:Profile { profileId: $firstId })
            SET first.__connectionPromptPairLock =
                coalesce(first.__connectionPromptPairLock, 0) + 1
            WITH first
            OPTIONAL MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (counterpart:Profile { profileId: $counterpartId })
            WITH first, prompt,
                 CASE
                     WHEN prompt IS NOT NULL
                       AND prompt.status = 'PENDING'
                       AND prompt.triggerId = $triggerId
                       AND coalesce(prompt.notificationDelivered, false) = false
                       AND (
                           prompt.notificationDeliveryAttemptToken IS NULL
                           OR prompt.notificationDeliveryAttemptedAt IS NULL
                           OR prompt.notificationDeliveryAttemptedAt <= $staleBefore
                       )
                     THEN true
                     ELSE false
                 END AS canClaim
            FOREACH (_ IN CASE WHEN canClaim THEN [1] ELSE [] END |
                SET prompt.notificationDeliveryAttemptToken = $attemptToken,
                    prompt.notificationDeliveryAttemptedAt = $attemptedAt
            )
            REMOVE first.__connectionPromptPairLock
            RETURN canClaim AS claimed
        `,
        {
            firstId: [viewer.profileId, counterpart.profileId].sort()[0],
            viewerId: viewer.profileId,
            counterpartId: counterpart.profileId,
            promptId,
            triggerId,
            attemptToken,
            attemptedAt: attemptedAt.toISOString(),
            staleBefore: new Date(
                attemptedAt.getTime() - SENDER_NOTIFICATION_ATTEMPT_LEASE_MS
            ).toISOString(),
        }
    );

    return result.records[0]?.get('claimed') === true ? attemptToken : undefined;
};

const markSenderPromptNotificationDelivered = async (
    viewer: ProfileType,
    promptId: string,
    triggerId: string,
    attemptToken: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (:Profile)
            WHERE prompt.status = 'PENDING'
              AND prompt.triggerId = $triggerId
              AND coalesce(prompt.notificationDelivered, false) = false
              AND prompt.notificationDeliveryAttemptToken = $attemptToken
            SET prompt.notificationDelivered = true
            REMOVE prompt.notificationDeliveryAttemptToken,
                   prompt.notificationDeliveryAttemptedAt
        `,
        { viewerId: viewer.profileId, promptId, triggerId, attemptToken }
    );
};

const skipSenderPromptAfterNotificationRejection = async (
    viewer: ProfileType,
    promptId: string,
    triggerId: string,
    attemptToken: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (:Profile)
            WHERE prompt.status = 'PENDING'
              AND prompt.triggerId = $triggerId
              AND coalesce(prompt.notificationDelivered, false) = false
              AND prompt.notificationDeliveryAttemptToken = $attemptToken
            SET prompt.status = 'SKIPPED', prompt.updatedAt = $updatedAt
            REMOVE prompt.notificationDeliveryAttemptToken,
                   prompt.notificationDeliveryAttemptedAt
        `,
        {
            viewerId: viewer.profileId,
            promptId,
            triggerId,
            attemptToken,
            updatedAt: new Date().toISOString(),
        }
    );
};

const releaseSenderPromptNotificationDelivery = async (
    viewer: ProfileType,
    promptId: string,
    triggerId: string,
    attemptToken: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (:Profile)
            WHERE prompt.status = 'PENDING'
              AND prompt.triggerId = $triggerId
              AND coalesce(prompt.notificationDelivered, false) = false
              AND prompt.notificationDeliveryAttemptToken = $attemptToken
            REMOVE prompt.notificationDeliveryAttemptToken,
                   prompt.notificationDeliveryAttemptedAt
        `,
        { viewerId: viewer.profileId, promptId, triggerId, attemptToken }
    );
};

export const handleConnectionPromptsForCredentialClaim = async (
    input: CreateConnectionPromptsForClaimInput & {
        vcUris?: string[];
        metadata?: Record<string, unknown>;
    }
): Promise<ConnectionPromptCreationResult> => {
    let result: ConnectionPromptCreationResult;

    try {
        result = await createConnectionPromptsForClaim(input);
    } catch (error) {
        console.error('Failed to create post-claim connection prompts', {
            claimerProfileId: input.claimer.profileId,
            senderProfileId: input.sender.profileId,
            triggerId: input.triggerId,
            error,
        });
        return {};
    }

    if (
        result.senderPrompt?.triggerId === input.triggerId &&
        !result.senderPrompt.notificationDelivered
    ) {
        let attemptToken: string | undefined;

        try {
            attemptToken = await claimSenderPromptNotificationDelivery(
                input.sender,
                input.claimer,
                result.senderPrompt.promptId,
                input.triggerId
            );
        } catch (error) {
            console.error('Failed to claim connection prompt notification delivery', {
                claimerProfileId: input.claimer.profileId,
                senderProfileId: input.sender.profileId,
                promptId: result.senderPrompt.promptId,
                triggerId: input.triggerId,
                error,
            });
            return result;
        }

        if (!attemptToken) return result;

        try {
            await addNotificationToQueue({
                type: LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED,
                to: input.sender,
                from: input.claimer,
                message: getNotificationMessage(
                    'boostAcceptedConnect',
                    resolveRecipientLocale(input.sender),
                    { name: input.claimer.displayName }
                ),
                data: {
                    vcUris: input.vcUris,
                    metadata: {
                        ...input.metadata,
                        connectionPrompt: {
                            promptId: result.senderPrompt.promptId,
                            counterpartProfileId: input.claimer.profileId,
                        },
                    },
                },
            });

            try {
                await markSenderPromptNotificationDelivered(
                    input.sender,
                    result.senderPrompt.promptId,
                    input.triggerId,
                    attemptToken
                );
            } catch (error) {
                console.error('Failed to acknowledge connection prompt notification delivery', {
                    claimerProfileId: input.claimer.profileId,
                    senderProfileId: input.sender.profileId,
                    promptId: result.senderPrompt.promptId,
                    triggerId: input.triggerId,
                    error,
                });

                try {
                    await releaseSenderPromptNotificationDelivery(
                        input.sender,
                        result.senderPrompt.promptId,
                        input.triggerId,
                        attemptToken
                    );
                } catch (releaseError) {
                    console.error('Failed to release connection prompt notification delivery', {
                        claimerProfileId: input.claimer.profileId,
                        senderProfileId: input.sender.profileId,
                        promptId: result.senderPrompt.promptId,
                        triggerId: input.triggerId,
                        error: releaseError,
                    });
                }
            }
        } catch (error) {
            console.error('Failed to enqueue post-claim connection prompt notification', {
                claimerProfileId: input.claimer.profileId,
                senderProfileId: input.sender.profileId,
                promptId: result.senderPrompt.promptId,
                triggerId: input.triggerId,
                error,
            });

            try {
                await skipSenderPromptAfterNotificationRejection(
                    input.sender,
                    result.senderPrompt.promptId,
                    input.triggerId,
                    attemptToken
                );
            } catch (recoveryError) {
                console.error('Failed to recover undeliverable sender connection prompt', {
                    claimerProfileId: input.claimer.profileId,
                    senderProfileId: input.sender.profileId,
                    promptId: result.senderPrompt.promptId,
                    triggerId: input.triggerId,
                    error: recoveryError,
                });

                try {
                    await releaseSenderPromptNotificationDelivery(
                        input.sender,
                        result.senderPrompt.promptId,
                        input.triggerId,
                        attemptToken
                    );
                } catch (releaseError) {
                    console.error('Failed to release connection prompt notification delivery', {
                        claimerProfileId: input.claimer.profileId,
                        senderProfileId: input.sender.profileId,
                        promptId: result.senderPrompt.promptId,
                        triggerId: input.triggerId,
                        error: releaseError,
                    });
                }
            }

            return { ...result, senderNotificationFailed: true };
        }
    }

    return result;
};

export const getPendingConnectionPrompts = async (
    viewer: ProfileType
): Promise<LCNConnectionPrompt[]> => {
    const result = await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { status: 'PENDING' }]->
                  (counterpart:Profile)
            RETURN properties(prompt) AS prompt, counterpart
            ORDER BY prompt.triggeredAt ASC
        `,
        { viewerId: viewer.profileId }
    );

    const rows = convertQueryResultToPropertiesObjectArray<{
        prompt: Omit<LCNConnectionPrompt, 'counterpart'>;
        counterpart: FlatProfileType;
    }>(result);

    return rows.map(row =>
        LCNConnectionPromptValidator.parse({
            ...row.prompt,
            counterpart: LCNPublicProfileValidator.parse(inflateObject(row.counterpart as any)),
        })
    );
};

export const getConnectionPromptStatus = async (
    viewer: ProfileType,
    promptId: string
): Promise<LCNConnectionPromptActionResult> => {
    const result = await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (:Profile)
            RETURN prompt.promptId AS promptId, prompt.status AS status
            LIMIT 1
        `,
        { viewerId: viewer.profileId, promptId }
    );
    const [row] = convertQueryResultToPropertiesObjectArray<PromptStatusRow>(result);

    return LCNConnectionPromptActionResultValidator.parse(row ?? { promptId, status: 'STALE' });
};

export const skipConnectionPrompt = async (
    viewer: ProfileType,
    promptId: string
): Promise<LCNConnectionPromptActionResult> => {
    const counterpartResult = await neogma.queryRunner.run(
        `
            MATCH (:Profile { profileId: $viewerId })
                  -[:CONNECTION_PROMPT { promptId: $promptId }]->
                  (counterpart:Profile)
            RETURN counterpart.profileId AS counterpartId
            LIMIT 1
        `,
        { viewerId: viewer.profileId, promptId }
    );
    const counterpartId = counterpartResult.records[0]?.get('counterpartId') as string | undefined;

    if (!counterpartId) return getConnectionPromptStatus(viewer, promptId);

    const result = await runConnectionPairQuery(
        `
            MATCH (first:Profile { profileId: $firstId })
            SET first.__connectionPromptPairLock =
                coalesce(first.__connectionPromptPairLock, 0) + 1
            WITH first
            MATCH (viewer:Profile { profileId: $viewerId })
            MATCH (counterpart:Profile { profileId: $counterpartId })
            OPTIONAL MATCH (viewer)
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (counterpart)
            WITH prompt, first
            FOREACH (_ IN CASE
                WHEN prompt IS NOT NULL AND prompt.status = 'PENDING' THEN [1]
                ELSE []
            END |
                SET prompt.status = 'SKIPPED', prompt.updatedAt = $updatedAt
            )
            REMOVE first.__connectionPromptPairLock
            RETURN $promptId AS promptId, coalesce(prompt.status, 'STALE') AS status
        `,
        {
            viewerId: viewer.profileId,
            counterpartId,
            firstId: [viewer.profileId, counterpartId].sort()[0],
            promptId,
            updatedAt: new Date().toISOString(),
        }
    );
    const [row] = convertQueryResultToPropertiesObjectArray<PromptStatusRow>(result);

    if (row) return LCNConnectionPromptActionResultValidator.parse(row);

    return getConnectionPromptStatus(viewer, promptId);
};

export const connectWithConnectionPrompt = async (
    viewer: ProfileType,
    promptId: string
): Promise<LCNConnectionPromptActionResult> => {
    const counterpartResult = await neogma.queryRunner.run(
        `
            MATCH (:Profile { profileId: $viewerId })
                  -[:CONNECTION_PROMPT { promptId: $promptId }]->
                  (counterpart:Profile)
            RETURN counterpart.profileId AS counterpartId
            LIMIT 1
        `,
        { viewerId: viewer.profileId, promptId }
    );
    const counterpartId = counterpartResult.records[0]?.get('counterpartId') as string | undefined;

    if (!counterpartId) return getConnectionPromptStatus(viewer, promptId);

    const result = await runConnectionPairQuery(
        `
            MATCH (first:Profile { profileId: $firstId })
            SET first.__connectionPromptPairLock =
                coalesce(first.__connectionPromptPairLock, 0) + 1
            WITH first
            MATCH (a:Profile { profileId: $viewerId })
            MATCH (b:Profile { profileId: $counterpartId })
            OPTIONAL MATCH (a)-[prompt:CONNECTION_PROMPT { promptId: $promptId }]->(b)
            WITH a, b, prompt, first
            OPTIONAL MATCH (a)-[blocked:BLOCKED]-(b)
            WITH a, b, prompt, first,
                 count(blocked) > 0 AS isBlocked,
                 prompt IS NOT NULL AND prompt.status = 'PENDING' AS isPending
            OPTIONAL MATCH (a)-[existingConnection:CONNECTED_WITH]-(b)
            WITH a, b, prompt, first, isBlocked, isPending,
                 count(existingConnection) > 0 AS hadConnection
            OPTIONAL MATCH (a)-[request:CONNECTION_REQUESTED]-(b)
            WITH a, b, prompt, first, isBlocked, isPending, hadConnection,
                 collect(request) AS requests
            FOREACH (request IN CASE WHEN isPending AND NOT isBlocked THEN requests ELSE [] END |
                DELETE request
            )
            FOREACH (_ IN CASE WHEN isPending AND NOT isBlocked THEN [1] ELSE [] END |
                MERGE (a)-[r:CONNECTED_WITH]->(b)
                ON CREATE SET r.sources = [$key]
                ON MATCH SET r.sources = CASE
                    WHEN r.sources IS NULL THEN [$key]
                    WHEN NOT $key IN r.sources THEN r.sources + $key
                    ELSE r.sources
                END
                MERGE (b)-[r2:CONNECTED_WITH]->(a)
                ON CREATE SET r2.sources = [$key]
                ON MATCH SET r2.sources = CASE
                    WHEN r2.sources IS NULL THEN [$key]
                    WHEN NOT $key IN r2.sources THEN r2.sources + $key
                    ELSE r2.sources
                END
            )
            WITH a, b, prompt, first, isBlocked, isPending, hadConnection
            OPTIONAL MATCH (a)-[pairPrompt:CONNECTION_PROMPT]-(b)
            FOREACH (_ IN CASE
                WHEN pairPrompt IS NOT NULL AND isPending AND isBlocked THEN [1]
                ELSE []
            END |
                SET pairPrompt.status = 'SKIPPED', pairPrompt.updatedAt = $updatedAt
            )
            FOREACH (_ IN CASE
                WHEN pairPrompt IS NOT NULL AND isPending AND NOT isBlocked THEN [1]
                ELSE []
            END |
                SET pairPrompt.status = $status, pairPrompt.updatedAt = $updatedAt
            )
            REMOVE first.__connectionPromptPairLock
            RETURN CASE
                       WHEN prompt IS NULL THEN 'STALE'
                       WHEN NOT isPending THEN prompt.status
                       WHEN isBlocked THEN 'SKIPPED'
                       ELSE $status
                   END AS status,
                   b AS counterpart,
                   isPending AND NOT isBlocked AND NOT hadConnection AS shouldNotify
        `,
        {
            viewerId: viewer.profileId,
            counterpartId,
            firstId: [viewer.profileId, counterpartId].sort()[0],
            promptId,
            key: 'manual',
            status: 'CONNECTED',
            updatedAt: new Date().toISOString(),
        }
    );
    const [row] = convertQueryResultToPropertiesObjectArray<{
        status: LCNConnectionPromptActionResult['status'];
        counterpart: FlatProfileType;
        shouldNotify: boolean;
    }>(result);

    if (!row) return getConnectionPromptStatus(viewer, promptId);

    if (row.status === 'CONNECTED' && row.shouldNotify) {
        const counterpart = inflateObject<ProfileType>(row.counterpart as any);
        const { sendConnectionAcceptedNotification } = await import('./connection.helpers');

        try {
            await sendConnectionAcceptedNotification(viewer, counterpart);
        } catch (error) {
            console.error('Failed to enqueue connection prompt acceptance notification', {
                viewerProfileId: viewer.profileId,
                counterpartProfileId: counterpart.profileId,
                promptId,
                error,
            });
        }
    }

    return LCNConnectionPromptActionResultValidator.parse({ promptId, status: row.status });
};
