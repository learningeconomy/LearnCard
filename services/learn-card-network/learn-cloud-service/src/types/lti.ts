export interface LtiPlatform {
    _id?: string;
    issuer: string;
    client_id: string;
    deployment_id: string;
    auth_login_url: string;
    auth_token_url: string;
    key_set_url: string;
    redirect_uris?: string[];
    custom_parameters?: Record<string, string>;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LtiState {
    _id?: string;
    state: string;
    nonce: string;
    platformId?: string;
    target_link_uri?: string;
    redirect_uri?: string;
    client_id?: string;
    login_hint?: string;
    lti_message_hint?: string;
    createdAt?: Date;
    expiresAt?: Date;
}

export interface LtiSession {
    _id?: string;
    platformId: string;
    userId: string;
    roles: string[];
    context?: {
        id: string;
        label?: string;
        title?: string;
    };
    resource_link?: {
        id: string;
        title?: string;
        description?: string;
    };
    custom?: Record<string, string>;
    lti_did?: string;
    token?: string;
    createdAt?: Date;
    expiresAt?: Date;
}

export interface LtiUserMapping {
    _id?: string;
    platformId: string;
    userId: string;
    did: string;
    updatedAt?: Date;
}

export interface LtiLoginParams {
    iss: string;
    login_hint: string;
    target_link_uri: string;
    client_id: string;
    lti_message_hint?: string;
    lti_deployment_id?: string;
}

export interface LtiJwtPayload {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    nonce: string;
    'https://purl.imsglobal.org/spec/lti/claim/message_type': string;
    'https://purl.imsglobal.org/spec/lti/claim/version': string;
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri'?: string;
    'https://purl.imsglobal.org/spec/lti/claim/resource_link'?: {
        id: string;
        title?: string;
        description?: string;
    };
    'https://purl.imsglobal.org/spec/lti/claim/context'?: {
        id: string;
        label?: string;
        title?: string;
        type?: string[];
    };
    'https://purl.imsglobal.org/spec/lti/claim/roles'?: string[];
    'https://purl.imsglobal.org/spec/lti/claim/custom'?: Record<string, string>;
    [key: string]: any;
}

export interface FastifyLtiRequest {
    query: {
        state?: string;
        id_token?: string;
        error?: string;
        error_description?: string;
        [key: string]: any;
    };
    body?: any;
    headers: Record<string, string | string[] | undefined>;
    method: string;
    url: string;
    params: {
        [key: string]: string;
    };
}