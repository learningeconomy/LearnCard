/**
 * The only place HCP v1 reaches into brain internals (besides the Neo4j adapter's
 * `@instance` and the router's tRPC builders). Keep it small: if v1 needs more
 * from the brain, it is named here.
 */
import { environment } from '@environment';
import { getContractDetailsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getServerDidWebDID } from '@helpers/learnCard.helpers';
import { getUriParts } from '@helpers/uri.helpers';

import type { HcpContracts } from './service/deps';

/** The HCP Provider identifier: this brain instance's did:web. */
export const providerId = (): string => getServerDidWebDID();

/** ConsentFlow contracts, read through the brain's contract access layer (LC-2421). */
export const contracts: HcpContracts = {
    current: async contractUri => {
        const isContract = (() => {
            try {
                return getUriParts(contractUri).type === 'contract';
            } catch {
                return false;
            }
        })();
        if (!isContract) return null;
        const details = await getContractDetailsByUri(contractUri);
        if (!details) return null;
        const { contract, contractOwner } = details;
        return {
            uri: contractUri,
            version: Number(contract.version ?? contract.currentVersion ?? 1),
            name: contract.name,
            owner: {
                profileId: contractOwner.profileId,
                displayName: contractOwner.displayName || contractOwner.profileId,
            },
            status: contract.status ?? 'active',
            expiresAt: contract.expiresAt ?? null,
            hcp: contract.contract.hcp ?? null,
        };
    },
};

/**
 * The HCP OAuth AS this brain approves sign-ins for: its base URL and the HS256
 * secret it shares with the AS. Null when either is unset (OAuth consent is off).
 */
export const oauthConsentConfig = (): { issuerUrl: string; secret: string } | null => {
    const issuerUrl = environment.HCP_OAUTH_ISSUER_URL?.trim();
    const secret = environment.HCP_OAUTH_TOKEN_SECRET;
    if (!issuerUrl || !secret) return null;
    return { issuerUrl, secret };
};
