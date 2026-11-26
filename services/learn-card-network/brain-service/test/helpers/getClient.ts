import { appRouter } from '../../src/app';
import { SeedLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { resolveTenantFromRequest } from '@learncard/email-templates';

export const getClient = (options?: {
    did?: string;
    isChallengeValid?: boolean;
    scope?: string;
    guardianApproval?: string;
}) => {
    const { did, isChallengeValid, scope, guardianApproval } = options ?? {};
    const domain = 'localhost%3A3000';
    // Production createContext always resolves a tenant, including in-process calls.
    const tenant = resolveTenantFromRequest({});

    if (!did)
        return appRouter.createCaller({ domain, tenant, _guardianApprovalToken: guardianApproval });

    return appRouter.createCaller({
        domain,
        tenant,
        user: { did, isChallengeValid: Boolean(isChallengeValid), scope },
        _guardianApprovalToken: guardianApproval,
    });
};

export const getVerifiedContactMethodClient = (options?: {
    domain?: string;
    contactMethod?: {
        id: string;
        createdAt: string;
        isPrimary: boolean;
        isVerified: boolean;
        type: 'email' | 'phone';
        value: string;
    };
}) => {
    const { domain = 'localhost%3A3000', contactMethod } = options ?? {};

    return appRouter.createCaller({
        domain,
        tenant: resolveTenantFromRequest({}),
        contactMethod,
    });
};

export const getUser = async (
    seed?: string,
    scope?: string
): Promise<{
    learnCard: SeedLearnCard;
    clients: {
        partialAuth: ReturnType<typeof getClient>;
        fullAuth: ReturnType<typeof getClient>;
    };
}> => {
    const learnCard = await getLearnCard(seed)!;
    const partialAuth = getClient({ did: learnCard.id.did() });
    const fullAuth = getClient({
        did: learnCard.id.did(),
        isChallengeValid: true,
        scope: scope || AUTH_GRANT_FULL_ACCESS_SCOPE,
    });

    return {
        learnCard,
        clients: { partialAuth, fullAuth },
    };
};
