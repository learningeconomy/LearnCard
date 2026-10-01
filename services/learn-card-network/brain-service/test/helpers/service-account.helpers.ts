import { randomUUID } from 'node:crypto';
import { ServiceAccount } from '@models';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { getClient } from './getClient';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { createContext } from '@routes';
import { appRouter } from '../../src/app';

export const setupServiceAccount = async () => {
    const id = randomUUID();
    const did = `did:key:partner-${id}`;
    const profileId = `partner-owner-${id}`;
    await createProfile({ profileId, did, displayName: profileId } as Parameters<
        typeof createProfile
    >[0]);
    const ecosystem = await createEcosystem({
        name: 'Partner',
        slug: `partner-${id}`,
        ownerProfileId: profileId,
        parentEcosystemId: null,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    const account = {
        id: `sa_${id}`,
        installId: `install_${id}`,
        activeInstallId: `install_${id}`,
        ecosystemId: ecosystem.id,
        status: 'PROVISIONED' as const,
        credentialGeneration: 0,
        createdAt: new Date().toISOString(),
    };
    await ServiceAccount.createOne(account);
    const client = getClient({ did, isChallengeValid: true, scope: AUTH_GRANT_FULL_ACCESS_SCOPE });
    return { account, ecosystem, client, profileId };
};

export const partnerContext = (token: string) =>
    createContext({
        req: {
            headers: new Map([
                ['authorization', `Bearer ${token}`],
                ['x-learncard-act-as', 'forged-profile'],
            ]),
        },
    });
export const partnerClient = async (token: string) =>
    appRouter.createCaller(await partnerContext(token));
