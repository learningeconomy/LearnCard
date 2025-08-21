import { Op, QueryBuilder, Where } from 'neogma';
import { LCNProfileConnectionStatusEnum, LCNNotificationTypeEnumValidator } from '@learncard/types';
import { TRPCError } from '@trpc/server';
import { Boost, Profile, Credential } from '@models';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { FlatProfileType, ProfileType } from 'types/profile';
import { inflateObject } from './objects.helpers';

export const getConnections = async (
    profile: ProfileType,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder()
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'source' })
        .match({
            optional: true,
            related: [
                { identifier: 'source' },
                { ...Profile.getRelationshipByAlias('connectedWith'), direction: 'none' },
                { identifier: 'directTarget', model: Profile },
            ],
        })
        .with('source, COLLECT(DISTINCT directTarget) AS directlyConnected')
        .match({
            optional: true,
            related: [
                { identifier: 'source' },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'none' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'none' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived'), direction: 'none' },
                { model: Profile, identifier: 'receivedBoostTarget' },
            ],
        })
        .with(
            'source, directlyConnected, COLLECT(DISTINCT receivedBoostTarget) AS receivedBoostTargets'
        )
        .match({
            optional: true,
            related: [
                { identifier: 'source' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Profile, identifier: 'ownedBoostTarget' },
            ],
        })
        .with(
            'directlyConnected, receivedBoostTargets, COLLECT(DISTINCT ownedBoostTarget) AS ownedBoostTargets'
        )
        .match({
            optional: true,
            related: [
                { model: Profile, identifier: 'otherOwnedBoostTarget' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { identifier: 'source' },
            ],
        })
        .where(`otherOwnedBoostTarget.profileId <> "${profile.profileId}"`)
        .with(
            'directlyConnected, receivedBoostTargets, ownedBoostTargets, COLLECT(DISTINCT otherOwnedBoostTarget) AS otherOwnedBoostTargets'
        )
        .with(
            'directlyConnected + receivedBoostTargets + ownedBoostTargets + otherOwnedBoostTargets AS allConnectedProfiles'
        )
        .unwind('allConnectedProfiles AS target')
        .with('target');

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
        Profile.relateTo({
            alias: 'connectedWith',
            where: {
                source: { profileId: source.profileId },
                target: { profileId: target.profileId },
            },
        }),
        Profile.relateTo({
            alias: 'connectedWith',
            where: {
                source: { profileId: target.profileId },
                target: { profileId: source.profileId },
            },
        }),
    ]);

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
    target: ProfileType
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

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
        to: target,
        from: source,
        message: {
            title: 'New Connection Request',
            body: `${source.displayName} has sent you a connection request!`,
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
