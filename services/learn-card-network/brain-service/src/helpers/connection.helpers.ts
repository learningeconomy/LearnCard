import { TRPCError } from '@trpc/server';
import { Profile, ProfileInstance } from '@models';

export const getConnections = async (profile: ProfileInstance): Promise<ProfileInstance[]> => {
    const [connectedTo, connectedBy] = await Promise.all([
        profile.findRelationships({ alias: 'connectedWith' }),
        Profile.findRelationships({
            alias: 'connectedWith',
            where: { target: { profileId: profile.profileId } },
        }),
    ]);

    const connectedTos = connectedTo.map(result => result.target);
    const connectedBys = connectedBy.map(result => result.source);

    return [...connectedTos, ...connectedBys].reduce<ProfileInstance[]>(
        (profiles, currentProfile) => {
            if (
                !profiles.find(
                    existingProfile => existingProfile.profileId === currentProfile.profileId
                )
            ) {
                profiles.push(currentProfile);
            }

            return profiles;
        },
        []
    );
};

export const getPendingConnections = async (
    profile: ProfileInstance
): Promise<ProfileInstance[]> => {
    return (await profile.findRelationships({ alias: 'connectionRequested' })).map(
        result => result.target
    );
};
export const getConnectionRequests = async (
    profile: ProfileInstance
): Promise<ProfileInstance[]> => {
    return (
        await Profile.findRelationships({
            alias: 'connectionRequested',
            where: { target: { profileId: profile.profileId } },
        })
    ).map(result => result.source);
};

/** Checks whether two profiles are already connected */
export const areProfilesConnected = async (
    source: ProfileInstance,
    target: ProfileInstance
): Promise<boolean> => {
    const [sourceConnectedToTarget, targetConnectedToSource] = await Promise.all([
        source.findRelationships({
            alias: 'connectedWith',
            where: { relationship: {}, target: { profileId: target.profileId } },
        }),
        target.findRelationships({
            alias: 'connectedWith',
            where: { relationship: {}, target: { profileId: source.profileId } },
        }),
    ]);

    return sourceConnectedToTarget.length > 0 || targetConnectedToSource.length > 0;
};

/** Connects two profiles */
export const connectProfiles = async (
    source: ProfileInstance,
    target: ProfileInstance,
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
                await target.findRelationships({
                    alias: 'connectionRequested',
                    where: { relationship: {}, target: { profileId: source.profileId } },
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
        source.relateTo({ alias: 'connectedWith', where: { profileId: target.profileId } }),
        target.relateTo({ alias: 'connectedWith', where: { profileId: source.profileId } }),
    ]);

    return true;
};

/** Disconnects two profiles */
export const disconnectProfiles = async (
    source: ProfileInstance,
    target: ProfileInstance,
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
    source: ProfileInstance,
    target: ProfileInstance
): Promise<boolean> => {
    const pendingRequestFromTarget =
        (
            await target.findRelationships({
                alias: 'connectionRequested',
                where: { relationship: {}, target: { profileId: source.profileId } },
            })
        ).length > 0;

    if (pendingRequestFromTarget) return connectProfiles(source, target);

    const pendingRequestToTarget =
        (
            await source.findRelationships({
                alias: 'connectionRequested',
                where: { relationship: {}, target: { profileId: target.profileId } },
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

    await source.relateTo({ alias: 'connectionRequested', where: { profileId: target.profileId } });

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
    source: ProfileInstance,
    target: ProfileInstance
): Promise<boolean> => {
    const pendingRequestToTarget =
        (
            await source.findRelationships({
                alias: 'connectionRequested',
                where: { relationship: {}, target: { profileId: target.profileId } },
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