import { TRPCError } from '@trpc/server';
import { Profile, ProfileInstance } from '@models';

export const getConnections = async (profile: ProfileInstance): Promise<ProfileInstance[]> => {
    const [connectedTo, connectedBy] = await Promise.all([
        profile.findRelationships({ alias: 'connectedWith' }),
        Profile.findRelationships({
            alias: 'connectedWith',
            where: { target: { handle: profile.handle } },
        }),
    ]);

    const connectedTos = connectedTo.map(result => result.target);
    const connectedBys = connectedBy.map(result => result.source);

    return [...connectedTos, ...connectedBys].reduce<ProfileInstance[]>(
        (profiles, currentProfile) => {
            if (
                !profiles.find(existingProfile => existingProfile.handle === currentProfile.handle)
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
            where: { target: { handle: profile.handle } },
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
            where: { relationship: {}, target: { handle: target.handle } },
        }),
        target.findRelationships({
            alias: 'connectedWith',
            where: { relationship: {}, target: { handle: source.handle } },
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
                    where: { relationship: {}, target: { handle: source.handle } },
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
            where: { source: { handle: source.handle }, target: { handle: target.handle } },
        }),
        Profile.deleteRelationships({
            alias: 'connectionRequested',
            where: { source: { handle: target.handle }, target: { handle: source.handle } },
        }),
        source.relateTo({ alias: 'connectedWith', where: { handle: target.handle } }),
        target.relateTo({ alias: 'connectedWith', where: { handle: source.handle } }),
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
                where: { relationship: {}, target: { handle: source.handle } },
            })
        ).length > 0;

    if (pendingRequestFromTarget) return connectProfiles(source, target);

    const pendingRequestToTarget =
        (
            await source.findRelationships({
                alias: 'connectionRequested',
                where: { relationship: {}, target: { handle: target.handle } },
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

    await source.relateTo({ alias: 'connectionRequested', where: { handle: target.handle } });

    return true;
};
