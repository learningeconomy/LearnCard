import { describe, expect, it } from 'vitest';

import {
    ApprovalArtifactValidator,
    BindingValidator,
    BundleManifestValidator,
    CAPABILITY_TABLE_VERSION,
    ConsentDecisionRecordValidator,
    EntitlementPolicyValidator,
    IntegrationManifestValidator,
    InstallIntentValidator,
    WalletManifestValidator,
} from '../src/education-os';

const roundTrip = <T>(validator: { parse: (input: unknown) => T }, input: unknown): T => {
    const parsed = validator.parse(input);
    const reparsed = validator.parse(JSON.parse(JSON.stringify(parsed)));

    expect(reparsed).toEqual(parsed);

    return parsed;
};

describe('@learncard/types EducationOS validators', () => {
    it('round-trips InstallIntent', () => {
        const parsed = roundTrip(InstallIntentValidator, {
            apiVersion: 'lc.install-intent/v1',
            intentId: 'int_123',
            ecosystemId: 'eco_123',
            proposal: {
                apiVersion: 'lc.install-intent-proposal/v1',
                source: {
                    type: 'CATALOG_LISTING',
                    listingId: 'listing_1',
                    versionId: 'version_1',
                    listingKind: 'INTEGRATION',
                },
                requestedConfig: { region: 'us-east-1' },
                proposedBindings: [
                    {
                        capability: 'wallet-claim',
                        provider: {
                            resourceType: 'WALLET_ENABLEMENT',
                            resourceId: 'wallet_1',
                            ecosystemId: 'eco_123',
                        },
                        consumer: {
                            resourceType: 'APP_AVAILABILITY',
                            resourceId: 'app_1',
                            ecosystemId: 'eco_123',
                        },
                    },
                ],
            },
            approval: {
                apiVersion: 'lc.install-approval/v1',
                state: 'APPROVED',
                artifact: {
                    apiVersion: 'lc.approval-artifact/v1',
                    planHash: 'hash_1',
                    planRevision: 3,
                    approvedBy: 'profile_1',
                    approvedAt: '2026-07-29T12:00:00.000Z',
                    authorityChanges: {
                        summary: 'Adds roster read scope',
                        addedScopes: ['roster:read'],
                        removedScopes: [],
                        affectedCapabilities: ['roster-source'],
                    },
                    consentTiers: ['roster'],
                    proposedBindings: [],
                    infrastructureEffects: ['Create tenant secret'],
                    dispositionPolicy: { mode: 'RETAIN', notes: 'Contractual retention' },
                },
            },
            plan: {
                apiVersion: 'lc.install-plan/v1',
                renderedAt: '2026-07-29T12:00:00.000Z',
                planHash: 'hash_1',
                planRevision: 3,
                scopesRequested: ['roster:read'],
                consentTiers: ['roster'],
                infrastructureEffects: ['Create tenant secret'],
                authorityChanges: {
                    summary: 'Adds roster read scope',
                    addedScopes: ['roster:read'],
                    removedScopes: [],
                    affectedCapabilities: ['roster-source'],
                },
                dispositionPolicy: { mode: 'RETAIN', notes: 'Contractual retention' },
            },
            spec: {
                apiVersion: 'lc.install-spec/v1',
                targets: [
                    {
                        targetType: 'INTEGRATION_INSTALL',
                        listingId: 'listing_1',
                        versionId: 'version_1',
                        scopes: ['roster:read'],
                        consentTiers: ['roster'],
                        config: { district: 'ca' },
                        entitlementRequirements: ['issuance'],
                    },
                ],
                bindings: [],
                pinnedVersionIds: ['version_1'],
                scopes: ['roster:read'],
                consentTiers: ['roster'],
                config: { district: 'ca' },
                entitlementRequirements: ['issuance'],
            },
            status: {
                apiVersion: 'lc.install-status/v1',
                phase: 'READY',
                message: 'Healthy',
                observedAt: '2026-07-29T12:05:00.000Z',
                statusRevision: 2,
                retryCount: 0,
            },
        });

        expect(parsed.apiVersion).toBe('lc.install-intent/v1');
    });

    it('round-trips ApprovalArtifact', () => {
        const parsed = roundTrip(ApprovalArtifactValidator, {
            apiVersion: 'lc.approval-artifact/v1',
            planHash: 'hash_2',
            planRevision: 1,
            approvedBy: 'profile_2',
            approvedAt: '2026-07-29T12:00:00.000Z',
            authorityChanges: {
                summary: 'No-op diff',
                addedScopes: [],
                removedScopes: [],
                affectedCapabilities: [],
            },
            consentTiers: ['directory'],
            proposedBindings: [],
            infrastructureEffects: [],
            dispositionPolicy: { mode: 'REVOKE_ONLY' },
        });

        expect(parsed.apiVersion).toBe('lc.approval-artifact/v1');
    });

    it('round-trips Binding', () => {
        const parsed = roundTrip(BindingValidator, {
            apiVersion: 'lc.binding/v1',
            bindingId: 'bind_1',
            ecosystemId: 'eco_1',
            capability: 'wallet-claim',
            provider: {
                resourceType: 'WALLET_ENABLEMENT',
                resourceId: 'wallet_1',
                ecosystemId: 'eco_1',
            },
            consumer: {
                resourceType: 'APP_AVAILABILITY',
                resourceId: 'app_1',
                ecosystemId: 'eco_1',
            },
            status: 'ACTIVE',
            approvedBy: 'profile_1',
            approvedAt: '2026-07-29T12:00:00.000Z',
            revisions: { bindingRevision: 2, policyRevision: 'policy_4' },
        });

        expect(parsed.apiVersion).toBe('lc.binding/v1');
    });

    it('round-trips BundleManifest', () => {
        const parsed = roundTrip(BundleManifestValidator, {
            apiVersion: 'lc.bundle/v1',
            id: 'bundle_1',
            version: '1.0.0',
            publisherDid: 'did:key:z6Mkpublisher',
            contains: [
                {
                    declarationId: 'issuer',
                    targetType: 'INTEGRATION_INSTALL',
                    listingId: 'listing_issuer',
                    versionId: 'version_issuer',
                },
            ],
            defaultBindings: [
                {
                    capability: 'credential-issuer',
                    providerDeclarationId: '$ecosystem',
                    consumerDeclarationId: 'issuer',
                    reason: 'Route ecosystem issuance to bundle consumer',
                },
            ],
            preflight: [{ entitlementKey: 'issuance', isolationTier: 'DEDICATED_STACK' }],
            signature: {
                alg: 'EdDSA',
                sig: 'bundle-signature',
                verificationMethod: 'did:key:z6Mkpublisher#z6Mkpublisher',
            },
        });

        expect(parsed.apiVersion).toBe('lc.bundle/v1');
    });

    it('round-trips WalletManifest', () => {
        const parsed = roundTrip(WalletManifestValidator, {
            apiVersion: 'lc.wallet/v1',
            id: 'wallet.learncard',
            version: '1.0.0',
            listingKind: 'WALLET',
            walletName: 'LearnCard',
            publisherDid: 'did:key:z6Mkwallet',
            claimProtocols: ['chapi', 'oid4vci'],
            platforms: ['ios', 'android', 'web'],
            endpoints: {
                claimUrl: 'https://wallet.example/claim',
                inviteUrl: 'https://wallet.example/invite',
                healthUrl: 'https://wallet.example/health',
            },
            provides: ['wallet-claim'],
            supportsApps: true,
            signature: {
                alg: 'EdDSA',
                sig: 'wallet-signature',
                verificationMethod: 'did:key:z6Mkwallet#z6Mkwallet',
            },
        });

        expect(parsed.apiVersion).toBe('lc.wallet/v1');
    });

    it('round-trips IntegrationManifest v1.2', () => {
        const parsed = roundTrip(IntegrationManifestValidator, {
            apiVersion: 'lc.integration/v1.2',
            id: 'com.example.roster-sync',
            version: '1.2.3',
            listingKind: 'INTEGRATION',
            publisherDid: 'did:key:z6Mkintegration',
            category: 'sis',
            scopes: [
                {
                    resource: 'group',
                    action: 'sync',
                    selectorKind: 'tree',
                    selectorValue: '$installEcosystemId',
                    reason: 'Import sections',
                },
            ],
            consentRequirements: ['directory', 'employment-record'],
            capabilities: {
                provided: ['record-provisioning'],
                consumed: ['roster-source'],
            },
            supportedRecordClasses: ['academic', 'employment'],
            extensionPoints: [
                {
                    point: 'roster.import',
                    annotations: { readOnly: false, destructive: false, idempotent: true },
                },
            ],
            endpoints: {
                connectUrl: 'https://example.com/connect',
                healthUrl: 'https://example.com/health',
                syncUrl: 'https://example.com/sync',
            },
            signature: {
                alg: 'EdDSA',
                sig: 'integration-signature',
                verificationMethod: 'did:key:z6Mkintegration#z6Mkintegration',
            },
        });

        expect(parsed.apiVersion).toBe('lc.integration/v1.2');
    });

    it('rejects capabilities outside the pinned wallet capability set', () => {
        expect(() =>
            WalletManifestValidator.parse({
                apiVersion: 'lc.wallet/v1',
                id: 'wallet.learncard',
                version: '1.0.0',
                listingKind: 'WALLET',
                walletName: 'LearnCard',
                publisherDid: 'did:key:z6Mkwallet',
                claimProtocols: ['chapi'],
                platforms: ['web'],
                endpoints: {},
                provides: ['record-provisioning'],
                supportsApps: false,
                signature: {
                    alg: 'EdDSA',
                    sig: 'wallet-signature',
                    verificationMethod: 'did:key:z6Mkwallet#z6Mkwallet',
                },
            })
        ).toThrow(/pinned capability set v1/i);
    });

    it('tracks the additive capability-set register at v1.2', () => {
        expect(CAPABILITY_TABLE_VERSION).toBe('v1.2');
    });

    it('round-trips ConsentDecisionRecord', () => {
        const parsed = roundTrip(ConsentDecisionRecordValidator, {
            id: 'cdr_1',
            occurredAt: '2026-07-29T12:00:00.000Z',
            ecosystemId: 'eco_1',
            subjectProfileId: 'subject_1',
            consentActor: {
                type: 'GUARDIAN',
                profileId: 'guardian_1',
                authorityReference: 'guardian-link',
                authorityRevision: 'rev-3',
            },
            consentFlowContractId: 'contract_1',
            consentTermsId: 'terms_1',
            consentRevision: 'consent-7',
            consentTiers: ['credential-body'],
            requestedScopes: ['credential:read'],
            approvedScopes: ['credential:read'],
            bindingId: 'bind_1',
            resourceId: 'install_1',
            releaseChannel: 'API',
            decision: 'ALLOW',
            reasonCodes: ['tier-match'],
            consentActiveAtDecision: true,
            policyRevision: 'policy-9',
        });

        expect(parsed.decision).toBe('ALLOW');
    });

    it('round-trips EntitlementPolicy', () => {
        const parsed = roundTrip(EntitlementPolicyValidator, {
            apiVersion: 'lc.entitlement-policy/v1',
            key: 'issuance',
            granted: true,
            grantedBy: 'profile_1',
            scope: { ecosystemId: 'eco_1', targetType: 'ecosystem' },
        });

        expect(parsed.apiVersion).toBe('lc.entitlement-policy/v1');
    });
});
