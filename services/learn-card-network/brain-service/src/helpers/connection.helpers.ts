import { Op, QueryBuilder, Where } from 'neogma';
import { neogma } from '@instance';
import {
    LCNProfileConnectionStatusEnum,
    LCNNotificationTypeEnumValidator,
    LCNNotificationTypeEnum,
} from '@learncard/types';
import { TRPCError } from '@trpc/server';
import { Profile } from '@models';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { FlatProfileType, ProfileType } from 'types/profile';
import { inflateObject } from './objects.helpers';

export const getConnections = async (
    profile: ProfileType,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder().match({
        related: [
            { model: Profile, where: { profileId: profile.profileId } },
            { ...Profile.getRelationshipByAlias('connectedWith'), direction: 'none' },
            { identifier: 'target', model: Profile },
        ],
    });

    const query = cursor
        ? _query.where(
              new Where({ target: { profileId: { [Op.gt]: cursor } } }, _query.getBindParam())
          )
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{ target: FlatProfileType }>(
        await query.return('DISTINCT target').orderBy('target.profileId').limit(limit).run()
    );

    return results.map(result => inflateObject(result.target as any));
};

/**
 * Returns a standardized key used in CONNECTED_WITH.sources for boost-based auto-connections
 */
export const getBoostConnectionSourceKey = (boostId: string): string => `boost:${boostId}`;

/**
 * Ensures mutual CONNECTED_WITH relationships exist between two profiles, adding the provided source key
 */
export const ensureMutualConnectionWithSource = async (
    aProfileId: string,
    bProfileId: string,
    sourceKey: string
): Promise<void> => {
    if (aProfileId === bProfileId) return;

    const cypher = `
        MATCH (a:Profile { profileId: $aId }), (b:Profile { profileId: $bId })
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
    `;

    await neogma.queryRunner.run(cypher, { aId: aProfileId, bId: bProfileId, key: sourceKey });
};

/**
 * Bulk version of ensureMutualConnectionWithSource. Rows are boostId/targetId pairs for a single selfId
 */
export const ensureMutualConnectionsForRows = async (
    selfId: string,
    rows: Array<{ boostId: string; targetId: string }>
): Promise<void> => {
    if (rows.length === 0) return;

    const cypher = `
        UNWIND $rows AS row
        WITH row, $selfId AS selfId
        WITH row.boostId AS boostId, row.targetId AS targetId, selfId
        WHERE targetId <> selfId
        WITH boostId, targetId, 'boost:' + boostId AS key, selfId
        MATCH (a:Profile { profileId: selfId }), (b:Profile { profileId: targetId })
        MERGE (a)-[r:CONNECTED_WITH]->(b)
        ON CREATE SET r.sources = [key]
        ON MATCH SET r.sources = CASE
            WHEN r.sources IS NULL THEN [key]
            WHEN NOT key IN r.sources THEN r.sources + key
            ELSE r.sources
        END
        MERGE (b)-[r2:CONNECTED_WITH]->(a)
        ON CREATE SET r2.sources = [key]
        ON MATCH SET r2.sources = CASE
            WHEN r2.sources IS NULL THEN [key]
            WHEN NOT key IN r2.sources THEN r2.sources + key
            ELSE r2.sources
        END
    `;

    await neogma.queryRunner.run(cypher, { selfId, rows });
};

/**
 * Compute and persist CONNECTED_WITH edges for a credential acceptance, including:
 * - direct and ancestor boosts with autoConnectRecipients true
 * - target boosts from AUTO_CONNECT claim hooks (regardless of autoConnect flag)
 * Connects to: recipients, explicit AUTO_CONNECT_RECIPIENT members, and the boost creator
 */
export const ensureConnectionsForCredentialAcceptance = async (
    self: ProfileType,
    credentialId: string
): Promise<void> => {
    const selfId = self.profileId;

    // Rows from autoConnectRecipients=true on claim boost and its ancestors
    const flaggedRowsQuery = `
        MATCH (c:Credential { id: $credentialId })-[:INSTANCE_OF]->(cb:Boost)
        OPTIONAL MATCH (pb:Boost)-[:PARENT_OF*1..]->(cb)
        WHERE pb.autoConnectRecipients = true
        WITH cb, COLLECT(DISTINCT pb) AS parents
        WITH CASE WHEN cb.autoConnectRecipients THEN [cb] ELSE [] END + parents AS boosts
        UNWIND boosts AS b
        OPTIONAL MATCH (b)-[:PARENT_OF*1..]->(desc:Boost)
        WITH b, COLLECT(DISTINCT desc) + [b] AS boostGroup
        UNWIND boostGroup AS gb
        OPTIONAL MATCH (cr:Credential)-[:INSTANCE_OF]->(gb)
        OPTIONAL MATCH (cr)-[:CREDENTIAL_RECEIVED]->(rcpt:Profile)
        WITH b, COLLECT(DISTINCT rcpt.profileId) AS recipientIds
        OPTIONAL MATCH (b)-[:AUTO_CONNECT_RECIPIENT]->(exp:Profile)
        WITH b, recipientIds, COLLECT(DISTINCT exp.profileId) AS explicitIds
        OPTIONAL MATCH (b)-[:CREATED_BY]->(creator:Profile)
        WITH b, recipientIds, explicitIds, COLLECT(creator.profileId) AS creatorIds
        WITH b.id AS boostId, recipientIds + explicitIds + creatorIds AS ids
        WITH boostId, [x IN ids WHERE x IS NOT NULL AND x <> $selfId] AS targetIds
        UNWIND targetIds AS targetId
        RETURN DISTINCT boostId, targetId
    `;

    // Rows from AUTO_CONNECT claim hooks regardless of autoConnectRecipients flag
    const explicitRowsQuery = `
        MATCH (c:Credential { id: $credentialId })-[:INSTANCE_OF]->(claimBoost:Boost)
        MATCH (claimBoost)<-[:HOOK_FOR]-(ch:ClaimHook { type: 'AUTO_CONNECT' })-[:TARGET]->(tb:Boost)
        WITH DISTINCT tb.id AS bid
        MATCH (b:Boost { id: bid })
        OPTIONAL MATCH (cr:Credential)-[:INSTANCE_OF]->(b)
        OPTIONAL MATCH (cr)-[:CREDENTIAL_RECEIVED]->(rcpt:Profile)
        WITH b, COLLECT(DISTINCT rcpt.profileId) AS recipientIds
        OPTIONAL MATCH (b)-[:AUTO_CONNECT_RECIPIENT]->(exp:Profile)
        WITH b, recipientIds, COLLECT(DISTINCT exp.profileId) AS explicitIds
        OPTIONAL MATCH (b)-[:CREATED_BY]->(creator:Profile)
        WITH b, recipientIds, explicitIds, COLLECT(creator.profileId) AS creatorIds
        WITH b.id AS boostId, recipientIds + explicitIds + creatorIds AS ids
        WITH boostId, [x IN ids WHERE x IS NOT NULL AND x <> $selfId] AS targetIds
        UNWIND targetIds AS targetId
        RETURN DISTINCT boostId, targetId
    `;

    const [flaggedRes, explicitRes] = await Promise.all([
        neogma.queryRunner.run(flaggedRowsQuery, { credentialId, selfId }),
        neogma.queryRunner.run(explicitRowsQuery, { credentialId, selfId }),
    ]);

    type Row = { boostId: string; targetId: string };

    const rows: Row[] = [
        ...((flaggedRes.records || []).map(r => ({
            boostId: r.get('boostId') as string,
            targetId: r.get('targetId') as string,
        })) as Row[]),
        ...((explicitRes.records || []).map(r => ({
            boostId: r.get('boostId') as string,
            targetId: r.get('targetId') as string,
        })) as Row[]),
    ];

    // De-duplicate rows
    const seen = new Set<string>();
    const deduped: Row[] = [];
    for (const row of rows) {
        const key = `${row.boostId}::${row.targetId}`;
        if (row.targetId === selfId) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(row);
    }

    await ensureMutualConnectionsForRows(selfId, deduped);
};

/**
 * Removes the given boost source from all CONNECTED_WITH edges. If an edge has no remaining sources, delete it.
 */
export const removeConnectionsForBoost = async (boostId: string): Promise<void> => {
    const key = getBoostConnectionSourceKey(boostId);

    const cypher = `
        MATCH ()-[r:CONNECTED_WITH]-()
        WHERE r.sources IS NOT NULL AND $key IN r.sources
        SET r.sources = [x IN r.sources WHERE x <> $key]
        WITH r
        WHERE r.sources IS NULL OR size(r.sources) = 0
        DELETE r
    `;

    await neogma.queryRunner.run(cypher, { key });
};

export const getPendingConnections = async (
    profile: ProfileType,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder().match({
        related: [
            { model: Profile, where: { profileId: profile.profileId } },
            Profile.getRelationshipByAlias('connectionRequested'),
            { identifier: 'target', model: Profile },
        ],
    });

    const query = cursor
        ? _query.where(
              new Where({ target: { displayName: { [Op.gt]: cursor } } }, _query.getBindParam())
          )
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{ target: FlatProfileType }>(
        await query.return('DISTINCT target').orderBy('target.displayName').limit(limit).run()
    );

    return results.map(result => inflateObject(result.target as any));
};
export const getConnectionRequests = async (
    profile: ProfileType,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder().match({
        related: [
            { identifier: 'source', model: Profile },
            Profile.getRelationshipByAlias('connectionRequested'),
            { model: Profile, where: { profileId: profile.profileId } },
        ],
    });

    const query = cursor
        ? _query.where(
              new Where({ source: { displayName: { [Op.gt]: cursor } } }, _query.getBindParam())
          )
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{ source: FlatProfileType }>(
        await query.return('DISTINCT source').orderBy('source.displayName').limit(limit).run()
    );

    return results.map(result => inflateObject(result.source as any));
};

/** Checks whether two profiles are already connected */
export const areProfilesConnected = async (
    source: ProfileType,
    target: ProfileType
): Promise<boolean> => {
    const [sourceConnectedToTarget, targetConnectedToSource] = await Promise.all([
        Profile.findRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: source.profileId },
                target: { profileId: target.profileId },
            },
        }),
        Profile.findRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: target.profileId },
                target: { profileId: source.profileId },
            },
        }),
    ]);

    return sourceConnectedToTarget.length > 0 || targetConnectedToSource.length > 0;
};

/** Connects two profiles */
export const connectProfiles = async (
    source: ProfileType,
    target: ProfileType,
    validate = true
): Promise<boolean> => {
    if (validate) {
        if (await areProfilesConnected(source, target)) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Profiles are already connected!',
            });
        }

        const pendingRequestFromTarget =
            (
                await Profile.findRelationships({
                    alias: 'connectionRequested',
                    where: {
                        source: { profileId: target.profileId },
                        relationship: {},
                        target: { profileId: source.profileId },
                    },
                })
            ).length > 0;

        if (!pendingRequestFromTarget) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message:
                    'No connection request found. Please try sending them a connection request!',
            });
        }
    }

    await Promise.all([
        Profile.deleteRelationships({
            alias: 'connectionRequested',
            where: {
                source: { profileId: source.profileId },
                target: { profileId: target.profileId },
            },
        }),
        Profile.deleteRelationships({
            alias: 'connectionRequested',
            where: {
                source: { profileId: target.profileId },
                target: { profileId: source.profileId },
            },
        }),
    ]);

    // Ensure mutual connectedWith edges with a stable 'manual' source tag
    await ensureMutualConnectionWithSource(source.profileId, target.profileId, 'manual');

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONNECTION_ACCEPTED,
        to: target,
        from: source,
        message: {
            title: 'Connection Accepted',
            body: `${source.displayName} has accepted your connection request!`,
        },
    });

    return true;
};

/** Disconnects two profiles */
export const disconnectProfiles = async (
    source: ProfileType,
    target: ProfileType,
    validate = true
): Promise<boolean> => {
    if (validate && !(await areProfilesConnected(source, target))) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profiles are not connected!',
        });
    }

    await Promise.all([
        Profile.deleteRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: source.profileId },
                target: { profileId: target.profileId },
            },
        }),
        Profile.deleteRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: target.profileId },
                target: { profileId: source.profileId },
            },
        }),
    ]);

    return true;
};

/**
 * Sends a connection request from one profile to another
 *
 * If one the target profile has already sent a connection request, connects the two profiles
 *
 * Errors if a request has already been sent to the target, or if the two profiles are already
 * connected
 */
export const requestConnection = async (
    source: ProfileType,
    target: ProfileType,
    notificationType: LCNNotificationTypeEnum = LCNNotificationTypeEnumValidator.enum
        .CONNECTION_REQUEST
): Promise<boolean> => {
    const pendingRequestFromTarget =
        (
            await Profile.findRelationships({
                alias: 'connectionRequested',
                where: {
                    source: { profileId: target.profileId },
                    relationship: {},
                    target: { profileId: source.profileId },
                },
            })
        ).length > 0;

    if (pendingRequestFromTarget) return connectProfiles(source, target);

    const pendingRequestToTarget =
        (
            await Profile.findRelationships({
                alias: 'connectionRequested',
                where: {
                    source: { profileId: source.profileId },
                    relationship: {},
                    target: { profileId: target.profileId },
                },
            })
        ).length > 0;

    if (pendingRequestToTarget) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot request connection. Connection already requested!',
        });
    }

    if (await areProfilesConnected(source, target)) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot request connection. Profiles are already connected!',
        });
    }

    await Profile.relateTo({
        alias: 'connectionRequested',
        where: { source: { profileId: source.profileId }, target: { profileId: target.profileId } },
    });

    const isExpiredInviteRequest =
        notificationType ===
        LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST_EXPIRED_INVITE;

    await addNotificationToQueue({
        type: notificationType,
        to: target,
        from: source,
        message: {
            title: isExpiredInviteRequest
                ? 'Connection Request (Expired Invite)'
                : 'New Connection Request',
            body: isExpiredInviteRequest
                ? `${source.displayName} tried to connect with an expired link and has sent you a connection request.`
                : `${source.displayName} has sent you a connection request!`,
        },
    });

    return true;
};

/**
 * Cancels a connection request from one profile to another
 *
 * If one the target profile has already sent a connection request, connects the two profiles
 *
 * Errors if a request has already been sent to the target, or if the two profiles are already
 * connected
 */
export const cancelConnectionRequest = async (
    source: ProfileType,
    target: ProfileType
): Promise<boolean> => {
    const pendingRequestToTarget =
        (
            await Profile.findRelationships({
                alias: 'connectionRequested',
                where: {
                    source: { profileId: source.profileId },
                    relationship: {},
                    target: { profileId: target.profileId },
                },
            })
        ).length > 0;

    if (!pendingRequestToTarget) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No connection request to cancel',
        });
    }

    await Profile.deleteRelationships({
        alias: 'connectionRequested',
        where: { source: { profileId: source.profileId }, target: { profileId: target.profileId } },
    });

    return true;
};

/**
 * Returns the connection status between two users, from the source user's perspective
 * @param source the ProfileInstance of the user querying connection status
 * @param target the ProfileInstance of the user we are testing connection status with
 * @returns a value from the enum, LCNProfileConnectionStatusEnum
 */
export const getConnectionStatus = async (
    source: ProfileType,
    target: ProfileType
): Promise<LCNProfileConnectionStatusEnum> => {
    const [
        sourceConnectedToTarget,
        targetConnectedToSource,
        sourceRequestedTarget,
        targetRequestedSource,
    ] = await Promise.all([
        Profile.findRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: source.profileId },
                relationship: {},
                target: { profileId: target.profileId },
            },
        }),
        Profile.findRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: target.profileId },
                relationship: {},
                target: { profileId: source.profileId },
            },
        }),

        Profile.findRelationships({
            alias: 'connectionRequested',
            where: {
                source: { profileId: source.profileId },
                relationship: {},
                target: { profileId: target.profileId },
            },
        }),
        Profile.findRelationships({
            alias: 'connectionRequested',
            where: {
                source: { profileId: target.profileId },
                relationship: {},
                target: { profileId: source.profileId },
            },
        }),
    ]);

    if (sourceConnectedToTarget.length > 0 || targetConnectedToSource.length > 0) {
        return LCNProfileConnectionStatusEnum.enum.CONNECTED;
    } else if (sourceRequestedTarget.length > 0) {
        return LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_SENT;
    } else if (targetRequestedSource.length > 0) {
        return LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_RECEIVED;
    }
    return LCNProfileConnectionStatusEnum.enum.NOT_CONNECTED;
};

/** Checks if target is blocked by source */
export const isProfileBlocked = async (
    source: ProfileType,
    target: ProfileType
): Promise<boolean> => {
    return (
        (
            await Profile.findRelationships({
                alias: 'blocked',
                where: {
                    source: { profileId: source.profileId },
                    relationship: {},
                    target: { profileId: target.profileId },
                },
            })
        ).length > 0
    );
};

/** Checks if source or target are blocking each other */
export const isRelationshipBlocked = async (
    source?: ProfileType | null,
    target?: ProfileType | null
): Promise<boolean> => {
    if (!target || !source) return false;
    const [sourceBlockedTarget, targetBlockedSource] = await Promise.all([
        Profile.findRelationships({
            alias: 'blocked',
            where: {
                source: { profileId: source.profileId },
                relationship: {},
                target: { profileId: target.profileId },
            },
        }),
        Profile.findRelationships({
            alias: 'blocked',
            where: {
                source: { profileId: target.profileId },
                relationship: {},
                target: { profileId: source.profileId },
            },
        }),
    ]);

    return sourceBlockedTarget.length > 0 || targetBlockedSource.length > 0;
};

/** Blocks a profile */
export const blockProfile = async (source: ProfileType, target: ProfileType): Promise<boolean> => {
    await Promise.all([
        Profile.deleteRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: source.profileId },
                target: { profileId: target.profileId },
            },
        }),
        Profile.deleteRelationships({
            alias: 'connectedWith',
            where: {
                source: { profileId: target.profileId },
                target: { profileId: source.profileId },
            },
        }),
        Profile.deleteRelationships({
            alias: 'connectionRequested',
            where: {
                source: { profileId: source.profileId },
                target: { profileId: target.profileId },
            },
        }),
        Profile.deleteRelationships({
            alias: 'connectionRequested',
            where: {
                source: { profileId: target.profileId },
                target: { profileId: source.profileId },
            },
        }),
        Profile.relateTo({
            alias: 'blocked',
            where: {
                source: { profileId: source.profileId },
                target: { profileId: target.profileId },
            },
        }),
    ]);

    return true;
};

/** Unblocks a profile */
export const unblockProfile = async (
    source: ProfileType,
    target: ProfileType,
    validate = true
): Promise<boolean> => {
    if (validate && !(await isProfileBlocked(source, target))) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile is not blocked!',
        });
    }

    await Profile.deleteRelationships({
        alias: 'blocked',
        where: {
            source: { profileId: source.profileId },
            target: { profileId: target.profileId },
        },
    });

    return true;
};

export const getBlockedProfiles = async (profile: ProfileType): Promise<ProfileType[]> => {
    const result = convertQueryResultToPropertiesObjectArray<{ target: FlatProfileType }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: Profile, where: { profileId: profile.profileId } },
                    Profile.getRelationshipByAlias('blocked'),
                    { model: Profile, identifier: 'target' },
                ],
            })
            .return('target')
            .run()
    );

    return result.map(({ target }) => inflateObject(target as any));
};

export const getBlockedAndBlockedByRelationships = async (
    profile: ProfileType
): Promise<ProfileType[]> => {
    const result = convertQueryResultToPropertiesObjectArray<{ target: FlatProfileType }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: Profile, where: { profileId: profile.profileId } },
                    { ...Profile.getRelationshipByAlias('blocked'), direction: 'none' },
                    { model: Profile, identifier: 'target' },
                ],
            })
            .return('target')
            .run()
    );

    return result.map(({ target }) => inflateObject(target as any));
};

export const getBlockedAndBlockedByIds = async (profile: ProfileType): Promise<string[]> => {
    return (await getBlockedAndBlockedByRelationships(profile))
        .map(p => p.profileId)
        .filter(profileId => profileId !== profile.profileId);
};
