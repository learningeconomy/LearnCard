import { TRPCError } from '@trpc/server';
import Profile, { ProfileInstance } from '@models/Profile';

/**
 * Accepts a VC
 */
export const acceptCredential = async (
    source: ProfileInstance,
    target: ProfileInstance,
    vc: string
): Promise<boolean> => {
    const pendingVc =
        (
            await target.findRelationships({
                alias: 'pendingCredential',
                where: { relationship: { vc }, target: { handle: source.handle } },
            })
        ).length > 0;

    if (!pendingVc) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Pending Credential not found',
        });
    }

    await Profile.deleteRelationships({
        alias: 'pendingCredential',
        where: {
            source: { handle: target.handle },
            target: { handle: source.handle },
            relationship: { vc },
        },
    });

    await target.relateTo({
        alias: 'credentialSent',
        where: { handle: source.handle },
        properties: { vc },
    });

    return true;
};
