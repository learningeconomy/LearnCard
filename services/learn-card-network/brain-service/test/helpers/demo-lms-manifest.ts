/**
 * The unsigned `lc.integration` manifest seed-dev-integration signs, and the Demo LMS
 * flavour of it the walkthrough uses (`seed:dev-integration --app-name "Demo LMS"
 * --slug demo-lms --category lms --scopes completion:ingest --capabilities-provided
 * record-provisioning --consent-requirements credential-body`). Shared by the seed script
 * and the scenario runner so both pin the same manifest.
 */
import type { IntegrationManifest } from '@learncard/types';

export type UnsignedIntegrationManifest = Omit<IntegrationManifest, 'signature'>;

export type IntegrationManifestInput = {
    apiVersion: IntegrationManifest['apiVersion'];
    id: string;
    version: string;
    publisherDid: string;
    category: IntegrationManifest['category'];
    /** `resource:action` verbs, each granted over the installing ecosystem tree. */
    scopeVerbs: string[];
    consentRequirements: IntegrationManifest['consentRequirements'];
    provided: IntegrationManifest['capabilities']['provided'];
    consumed: IntegrationManifest['capabilities']['consumed'];
    recordClasses: IntegrationManifest['supportedRecordClasses'];
    subscribes: IntegrationManifest['subscribes'];
    consoleSurfaces: IntegrationManifest['consoleSurfaces'];
    healthUrl: string;
    connectUrl: string;
};

export const buildIntegrationManifest = (
    input: IntegrationManifestInput
): UnsignedIntegrationManifest => ({
    apiVersion: input.apiVersion,
    id: input.id,
    version: input.version,
    listingKind: 'INTEGRATION',
    publisherDid: input.publisherDid,
    category: input.category,
    scopes: input.scopeVerbs.map(verb => {
        const [resource, action] = verb.split(':');
        if (!resource || !action)
            throw new Error(`--scopes entry "${verb}" must be resource:action`);
        return {
            resource,
            action,
            selectorKind: 'tree' as const,
            selectorValue: '$installEcosystemId',
            // Unchanged default text keeps previously seeded manifests byte-identical.
            reason:
                verb === 'group:sync'
                    ? `Sync ${input.category} data for the installing ecosystem`
                    : `${resource}:${action} for the installing ecosystem (${input.category})`,
        };
    }),
    consentRequirements: input.consentRequirements,
    capabilities: { provided: input.provided, consumed: input.consumed },
    supportedRecordClasses: input.recordClasses,
    extensionPoints: [],
    subscribes: input.subscribes,
    consoleSurfaces: input.consoleSurfaces,
    endpoints: { healthUrl: input.healthUrl, connectUrl: input.connectUrl },
});

export const DEMO_LMS_APP_NAME = 'Demo LMS';
export const DEMO_LMS_LISTING_SLUG = 'demo-lms';
/** seed-dev-integration derives the id from the slug: `com.learncard.dev.<slug with dots>`. */
export const DEMO_LMS_MANIFEST_ID = 'com.learncard.dev.demo.lms';

/** The Demo LMS manifest; `origin` is where its health and connect endpoints answer. */
export const buildDemoLmsManifest = (input: {
    publisherDid: string;
    origin: string;
    version?: string;
}): UnsignedIntegrationManifest =>
    buildIntegrationManifest({
        apiVersion: 'lc.integration/v1.2',
        id: DEMO_LMS_MANIFEST_ID,
        version: input.version ?? '1.0.0',
        publisherDid: input.publisherDid,
        category: 'lms',
        scopeVerbs: ['completion:ingest'],
        consentRequirements: ['credential-body'],
        provided: ['record-provisioning'],
        consumed: [],
        recordClasses: ['academic'],
        subscribes: [],
        consoleSurfaces: [],
        healthUrl: `${input.origin}/health`,
        connectUrl: `${input.origin}/connect`,
    });
