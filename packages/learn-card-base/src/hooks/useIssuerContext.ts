import { useQuery } from '@tanstack/react-query';
import { isAppDidWeb } from '@learncard/helpers';
import type { IssuerContext, IssuerTrustProfile, VC } from '@learncard/types';

import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import {
    resolveIssuerContext,
    type RegistrySource,
} from 'learn-card-base/helpers/issuerContext.helpers';
export {
    getIssuerContextLabel,
    getIssuerContextName,
    resolveIssuerContext,
    type ResolveIssuerContextInput,
} from 'learn-card-base/helpers/issuerContext.helpers';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import { useWallet } from 'learn-card-base/hooks/useWallet';
import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';
import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

export const deriveIssuerTrustProfile = (credential: VC): IssuerTrustProfile =>
    getDefaultCategoryForCredential(credential) === BoostCategoryOptionsEnum.socialBadge
        ? 'social'
        : 'credential';

const getRegistryIssuerName = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object' || !('results' in value)) return undefined;
    const { results } = value;
    if (!results || typeof results !== 'object' || !('matchingIssuers' in results)) {
        return undefined;
    }
    const { matchingIssuers } = results;
    if (!Array.isArray(matchingIssuers)) return undefined;
    const issuer = matchingIssuers[0]?.issuer;
    if (!issuer || typeof issuer !== 'object' || !('federation_entity' in issuer)) {
        return undefined;
    }
    const federationEntity = issuer.federation_entity;
    if (
        !federationEntity ||
        typeof federationEntity !== 'object' ||
        !('organization_name' in federationEntity)
    ) {
        return undefined;
    }

    return typeof federationEntity.organization_name === 'string'
        ? federationEntity.organization_name
        : undefined;
};

type UseIssuerContextOptions = {
    enabled?: boolean;
    managedBoost?: boolean;
    trustProfile?: IssuerTrustProfile;
};

export const useIssuerContext = (
    credential: VC,
    options: UseIssuerContextOptions = {}
): {
    issuerContext?: IssuerContext;
    isLoading: boolean;
    registryIssuerName?: string;
} => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const wallet = walletStore.use.wallet();
    const issuerDid =
        typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id ?? '';
    const subject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;
    const holderDid = options.managedBoost
        ? issuerDid
        : switchedDid ?? wallet?.id.did() ?? subject?.id;
    const trustProfile = options.trustProfile ?? deriveIssuerTrustProfile(credential);
    const registry = useKnownDIDRegistry(issuerDid);
    const rawRegistrySource = registry.data?.source;
    const registrySource: RegistrySource | undefined =
        rawRegistrySource === 'trusted' ||
        rawRegistrySource === 'untrusted' ||
        rawRegistrySource === 'unknown'
            ? rawRegistrySource
            : undefined;
    const relationshipRequired =
        options.enabled !== false &&
        trustProfile === 'social' &&
        Boolean(issuerDid) &&
        issuerDid !== holderDid &&
        !isAppDidWeb(issuerDid) &&
        registry.isFetched &&
        registrySource !== 'trusted' &&
        registrySource !== 'untrusted';
    const relationship = useQuery({
        queryKey: ['issuer-context', holderDid, issuerDid],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.resolveIssuerContext(issuerDid);
        },
        enabled: relationshipRequired,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
        retry: 1,
    });
    const resolvedContext = resolveIssuerContext({
        issuerDid,
        holderDid,
        trustProfile,
        registrySource,
        isAppIssuer: isAppDidWeb(issuerDid),
        relationship: relationship.data,
    });
    const unresolvedContext =
        registry.isPending || (relationshipRequired && relationship.isPending);
    const registryIssuerName = getRegistryIssuerName(registry.data);

    return {
        issuerContext: unresolvedContext ? undefined : resolvedContext,
        isLoading: unresolvedContext,
        registryIssuerName,
    };
};
