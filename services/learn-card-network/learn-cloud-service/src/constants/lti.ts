export const LTI_DATABASE_URI = process.env.LTI_DATABASE_URI || process.env.LEARN_CLOUD_MONGO_URI;
export const LTI_DATABASE_NAME = process.env.LTI_DATABASE_NAME || process.env.LEARN_CLOUD_MONGO_DB_NAME;
export const LTI_KEY_ID = process.env.LTI_KEY_ID || 'lc-lti-key';
export const LTI_PRIVATE_KEY = process.env.LTI_PRIVATE_KEY || '';
export const LTI_CLIENT_ID = process.env.LTI_CLIENT_ID || 'learncard-lti';
export const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4100';

// LTI service endpoints
export const LTI_ENDPOINTS = {
    JWKS: '/.well-known/jwks.json',
    CONFIG: '/lti/config',
    LOGIN: '/lti/login',
    LAUNCH: '/lti/launch',
    AUTH: '/lti/auth',
    REDIRECT: '/lti/redirect',
    DEEP_LINKING: '/lti/deep-linking',
    TOOL_PROXY: '/lti/tool-proxy',
};

// LTI 1.3 Message types
export const LTI_MESSAGE_TYPES = {
    RESOURCE_LINK: 'LtiResourceLinkRequest',
    DEEP_LINKING: 'LtiDeepLinkingRequest',
    SUBMISSION_REVIEW: 'LtiSubmissionReviewRequest',
};

// LTI 1.3 Scopes
export const LTI_SCOPES = [
    'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
    'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly',
    'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
    'https://purl.imsglobal.org/spec/lti-ags/scope/score',
    'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
];

// LTI 1.3 Claims
export const LTI_CLAIMS = {
    MESSAGE_TYPE: 'https://purl.imsglobal.org/spec/lti/claim/message_type',
    VERSION: 'https://purl.imsglobal.org/spec/lti/claim/version',
    DEPLOYMENT_ID: 'https://purl.imsglobal.org/spec/lti/claim/deployment_id',
    TARGET_LINK_URI: 'https://purl.imsglobal.org/spec/lti/claim/target_link_uri',
    RESOURCE_LINK: 'https://purl.imsglobal.org/spec/lti/claim/resource_link',
    CONTEXT: 'https://purl.imsglobal.org/spec/lti/claim/context',
    ROLES: 'https://purl.imsglobal.org/spec/lti/claim/roles',
    CUSTOM: 'https://purl.imsglobal.org/spec/lti/claim/custom',
    LIS: 'https://purl.imsglobal.org/spec/lti/claim/lis',
    DEEP_LINKING_SETTINGS: 'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings',
};