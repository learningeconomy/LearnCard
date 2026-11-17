import {
    CUSTOM_CATEGORY_SENSITIVITY,
    GENERAL_CONTEXT_PROFILE,
    HCP_ENTRY_SCHEMA,
    REGISTERED_CATEGORIES,
    REGISTERED_CATEGORY_IDS,
    type Meta,
} from '../schemas';

/** The Draft 3 text this module implements. Keep in sync with README.md. */
export const HCP_SPEC_PIN = {
    repository: 'https://github.com/loyalagents/hcp-spec',
    path: 'spec/2.0-draft-3',
    commit: 'b790561830702c067cd7810c96ee78dd3d84741c',
} as const;

/** tRPC procedure paths under `hcp.v1`, also the operations this version supports. */
export const HCP_V1_OPERATIONS = [
    'meta',
    'entries.create',
    'entries.query',
    'entries.get',
    'entries.revise',
    'entries.withdraw',
    'grants.create',
    'grants.list',
    'grants.get',
    'grants.revoke',
    'audit.list',
    'export',
] as const;

/** Discovery for v1, using Draft 3 §19 member names where they apply. */
export const hcpV1Meta = (): Meta => ({
    hcp_version: '2.0-draft-3',
    api_version: 'v1',
    spec: { ...HCP_SPEC_PIN },
    operations: [...HCP_V1_OPERATIONS],
    // Registered categories only: custom ones are per subject and meta is public.
    supported_categories: REGISTERED_CATEGORY_IDS.map(id => ({
        id,
        ...REGISTERED_CATEGORIES[id],
        registry: '1',
    })),
    category_registry: '1',
    custom_categories: {
        accepted: 'uri',
        schemes: ['https', 'http'],
        sensitivity: CUSTOM_CATEGORY_SENSITIVITY,
    },
    accepts_entry_schemas: [HCP_ENTRY_SCHEMA],
    content_profiles: [GENERAL_CONTEXT_PROFILE],
    minimization_method: 'lexical',
    audit_durability: { default: 'synchronous' },
    audit_integrity: 'append-only',
    storage_encryption: 'server',
    pagination: { audit: 'cursor' },
});
