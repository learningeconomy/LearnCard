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
import { FlatProfileType, ProfileType } from 'types/profile';

export type CreateConnectionPromptsForClaimInput = {
    claimer: ProfileType;
    sender: ProfileType;
    triggerId: string;
};

type PromptTransition = {
    promptId: string;
    surface: LCNConnectionPromptSurface;
    isNew: boolean;
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
    status: string;
    isNew: boolean;
};

type PromptStatusRow = {
    promptId: string;
    status: 'PENDING' | 'SKIPPED' | 'CONNECTED';
};

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

    const result = await neogma.queryRunner.run(
        `
            MATCH (claimer:Profile { profileId: $claimerId })
            MATCH (sender:Profile { profileId: $senderId })
            WHERE coalesce(claimer.isServiceProfile, false) = false
              AND coalesce(sender.isServiceProfile, false) = false
              AND NOT EXISTS { MATCH (claimer)-[:BLOCKED]-(sender) }
              AND NOT EXISTS { MATCH (claimer)-[:CONNECTED_WITH]-(sender) }
            WITH claimer, sender
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
                    prompt.updatedAt = $now
            )
            RETURN direction.role AS role,
                   prompt.promptId AS promptId,
                   prompt.surface AS surface,
                   prompt.status AS status,
                   isNew
        `,
        {
            claimerId: input.claimer.profileId,
            senderId: input.sender.profileId,
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
            isNew: row.isNew,
        };

        if (row.role === 'claimer') creationResult.claimerPrompt = transition;
        if (row.role === 'sender') creationResult.senderPrompt = transition;

        return creationResult;
    }, {});
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

    if (result.senderPrompt?.isNew) {
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
        } catch (error) {
            console.error('Failed to enqueue post-claim connection prompt notification', {
                claimerProfileId: input.claimer.profileId,
                senderProfileId: input.sender.profileId,
                triggerId: input.triggerId,
                error,
            });
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
            ORDER BY prompt.triggeredAt DESC
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
    const result = await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (:Profile)
            SET prompt.__connectionPromptLock = true
            REMOVE prompt.__connectionPromptLock
            WITH prompt
            WHERE prompt.status = 'PENDING'
            SET prompt.status = 'SKIPPED', prompt.updatedAt = $updatedAt
            RETURN prompt.promptId AS promptId, prompt.status AS status
        `,
        { viewerId: viewer.profileId, promptId, updatedAt: new Date().toISOString() }
    );
    const [row] = convertQueryResultToPropertiesObjectArray<PromptStatusRow>(result);

    if (row) return LCNConnectionPromptActionResultValidator.parse(row);

    return getConnectionPromptStatus(viewer, promptId);
};

const consumeConnectionPrompt = async (
    viewer: ProfileType,
    promptId: string
): Promise<ProfileType | undefined> => {
    const result = await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId }]->
                  (counterpart:Profile)
            SET prompt.__connectionPromptLock = true
            REMOVE prompt.__connectionPromptLock
            WITH prompt, counterpart
            WHERE prompt.status = 'PENDING'
            SET prompt.status = 'CONNECTED', prompt.updatedAt = $updatedAt
            RETURN counterpart
        `,
        { viewerId: viewer.profileId, promptId, updatedAt: new Date().toISOString() }
    );
    const [row] = convertQueryResultToPropertiesObjectArray<{ counterpart: FlatProfileType }>(
        result
    );

    return row ? inflateObject<ProfileType>(row.counterpart as any) : undefined;
};

const restoreConsumedPrompt = async (viewer: ProfileType, promptId: string): Promise<void> => {
    await neogma.queryRunner.run(
        `
            MATCH (viewer:Profile { profileId: $viewerId })
                  -[prompt:CONNECTION_PROMPT { promptId: $promptId, status: 'CONNECTED' }]->
                  (counterpart:Profile)
            WITH viewer, counterpart, prompt,
                 CASE WHEN viewer.profileId < counterpart.profileId
                      THEN viewer ELSE counterpart END AS first,
                 CASE WHEN viewer.profileId < counterpart.profileId
                      THEN counterpart ELSE viewer END AS second
            SET first.__connectionPromptPairLock = true
            REMOVE first.__connectionPromptPairLock
            SET second.__connectionPromptPairLock = true
            REMOVE second.__connectionPromptPairLock
            SET prompt.__connectionPromptLock = true
            REMOVE prompt.__connectionPromptLock
            WITH viewer, counterpart, prompt
            WHERE prompt.status = 'CONNECTED'
              AND NOT EXISTS { MATCH (viewer)-[:CONNECTED_WITH]-(counterpart) }
              AND NOT EXISTS { MATCH (viewer)-[:BLOCKED]-(counterpart) }
            SET prompt.status = 'PENDING', prompt.updatedAt = $updatedAt
        `,
        { viewerId: viewer.profileId, promptId, updatedAt: new Date().toISOString() }
    );
};

export const connectWithConnectionPrompt = async (
    viewer: ProfileType,
    promptId: string
): Promise<LCNConnectionPromptActionResult> => {
    const counterpart = await consumeConnectionPrompt(viewer, promptId);
    if (!counterpart) return getConnectionPromptStatus(viewer, promptId);

    const { areProfilesConnected, connectProfiles, isRelationshipBlocked } = await import(
        './connection.helpers'
    );

    if (await isRelationshipBlocked(viewer, counterpart)) {
        await markConnectionPromptsSkipped(viewer, counterpart);
        return getConnectionPromptStatus(viewer, promptId);
    }

    if (await areProfilesConnected(viewer, counterpart)) {
        return LCNConnectionPromptActionResultValidator.parse({ promptId, status: 'CONNECTED' });
    }

    try {
        await connectProfiles(viewer, counterpart, false);
    } catch (error) {
        if (await areProfilesConnected(viewer, counterpart)) {
            return LCNConnectionPromptActionResultValidator.parse({
                promptId,
                status: 'CONNECTED',
            });
        }

        await restoreConsumedPrompt(viewer, promptId);
        throw error;
    }

    return LCNConnectionPromptActionResultValidator.parse({ promptId, status: 'CONNECTED' });
};
