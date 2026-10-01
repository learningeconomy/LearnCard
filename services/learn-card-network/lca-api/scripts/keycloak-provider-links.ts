import { setTimeout } from 'node:timers/promises';
import { KeycloakAdminError, type createKeycloakAdmin } from './keycloak-admin';

export interface FirebaseProvider {
    providerId: string;
    uid: string;
    email?: string;
}

export interface FirebaseUser {
    uid: string;
    disabled: boolean;
    email?: string;
    providerData: FirebaseProvider[];
}

export interface FirebaseReader {
    getUsers: (identifiers: { uid: string }[]) => Promise<{ users: FirebaseUser[] }>;
}

export interface ProviderLinkSummary {
    linked: number;
    alreadyLinked: number;
    conflicts: number;
    noSocialProvider: number;
    wouldLink: number;
}

/** Firebase accepts at most 100 identifiers per call; keep requests sequential and paced. */
export const fetchFirebaseUsers = async (
    uids: string[],
    firebase: FirebaseReader,
    sleep: (ms: number) => Promise<void> = setTimeout
): Promise<Map<string, FirebaseUser>> => {
    const unique = [...new Set(uids)];
    const users = new Map<string, FirebaseUser>();
    for (let offset = 0; offset < unique.length; offset += 100) {
        if (offset) await sleep(1000);
        const identifiers = unique.slice(offset, offset + 100).map(uid => ({ uid }));
        for (let attempt = 0; ; attempt++) {
            try {
                const result = await firebase.getUsers(identifiers);
                for (const user of result.users) users.set(user.uid, user);
                break;
            } catch (error) {
                const code =
                    typeof error === 'object' && error !== null && 'code' in error
                        ? error.code
                        : undefined;
                if (
                    attempt >= 3 ||
                    (code !== 'auth/too-many-requests' && code !== 'auth/quota-exceeded')
                ) {
                    throw error;
                }
                await sleep(1000 * 2 ** attempt);
            }
        }
    }
    return users;
};

/** Only add identities; never remove or reassign a provider link, even on conflicts. */
export const linkFirebaseProviders = async ({
    userId,
    providers,
    apply,
    admin,
    log,
}: {
    userId?: string;
    providers: FirebaseProvider[];
    apply: boolean;
    admin: Pick<Awaited<ReturnType<typeof createKeycloakAdmin>>, 'links' | 'request'>;
    log: (message: string) => void;
}): Promise<ProviderLinkSummary> => {
    const summary: ProviderLinkSummary = {
        linked: 0,
        alreadyLinked: 0,
        conflicts: 0,
        noSocialProvider: 0,
        wouldLink: 0,
    };
    const social = providers.filter(
        provider => provider.providerId === 'google.com' || provider.providerId === 'apple.com'
    );
    if (!social.length) {
        summary.noSocialProvider++;
        return summary;
    }
    const links = userId ? await admin.links(userId) : [];
    for (const alias of ['google', 'apple']) {
        const matches = social.filter(provider => provider.providerId === `${alias}.com`);
        if (!matches.length) continue;
        const provider = matches[0]!;
        const existing = links.find(link => link.identityProvider === alias);
        if (
            !provider.uid ||
            new Set(matches.map(match => match.uid)).size > 1 ||
            (existing && existing.userId !== provider.uid)
        ) {
            summary.conflicts++;
            log(`CONFLICT: ${alias} identity differs; manual review required`);
            continue;
        }
        if (existing) {
            summary.alreadyLinked++;
            continue;
        }
        if (!apply) {
            summary.wouldLink++;
            log(`PLAN: link ${alias} (ownership conflicts checked on apply)`);
            continue;
        }
        if (!userId) throw new Error('A provisioned Keycloak user is required for linking');
        try {
            await admin.request(
                `/users/${encodeURIComponent(userId)}/federated-identity/${alias}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        identityProvider: alias,
                        userId: provider.uid,
                        userName: provider.email || provider.uid,
                    }),
                }
            );
            summary.linked++;
            log(`Linked ${alias}`);
        } catch (error) {
            if (!(error instanceof KeycloakAdminError) || error.status !== 409) throw error;
            summary.conflicts++;
            log(`CONFLICT: ${alias} identity already linked; manual review required`);
        }
    }
    return summary;
};
