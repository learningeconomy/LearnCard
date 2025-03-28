import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// Using getKeyPair in generateLtiJwks from lti.helpers.ts
import {
    generateLtiJwks,
    registerPlatform,
    findPlatform,
    createState,
    getAndConsumeState,
    storeSession,
    getSession,
    mapUserToDid,
    getDidForUser
} from '@helpers/lti.helpers';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { 
    LTI_CLIENT_ID, 
    LTI_ENDPOINTS, 
    LTI_MESSAGE_TYPES, 
    LTI_CLAIMS,
    SERVER_URL
} from './constants/lti';
import type { 
    LtiLoginParams, 
    LtiJwtPayload, 
    FastifyLtiRequest
} from './types/lti';

// LTI Fastify plugin implementation
export const ltiFastifyPlugin: FastifyPluginAsync = async fastify => {
    // JWKS endpoint for token validation
    fastify.get('/.well-known/jwks.json', async (_request, reply) => {
        return reply.send(generateLtiJwks());
    });

    // Tool configuration endpoint - returns XML for LMS configuration
    fastify.get('/lti/config', async (_request, reply) => {
        const toolConfig = `
        <toolConfiguration
            xmlns="http://www.imsglobal.org/xsd/lti/ltiv1p3/tool">
            <issuer>${SERVER_URL}</issuer>
            <client_id>${LTI_CLIENT_ID}</client_id>
            <deployment_id></deployment_id>
            <target_link_uri>${SERVER_URL}/lti/launch</target_link_uri>
            <claims>
                <lti_claim>${LTI_CLAIMS.MESSAGE_TYPE}</lti_claim>
                <lti_claim>${LTI_CLAIMS.VERSION}</lti_claim>
                <lti_claim>${LTI_CLAIMS.DEPLOYMENT_ID}</lti_claim>
                <lti_claim>${LTI_CLAIMS.TARGET_LINK_URI}</lti_claim>
                <lti_claim>${LTI_CLAIMS.RESOURCE_LINK}</lti_claim>
                <lti_claim>${LTI_CLAIMS.CONTEXT}</lti_claim>
                <lti_claim>${LTI_CLAIMS.ROLES}</lti_claim>
                <lti_claim>${LTI_CLAIMS.CUSTOM}</lti_claim>
                <lti_claim>${LTI_CLAIMS.LIS}</lti_claim>
                <lti_claim>${LTI_CLAIMS.DEEP_LINKING_SETTINGS}</lti_claim>
            </claims>
            <jwks_uri>${SERVER_URL}${LTI_ENDPOINTS.JWKS}</jwks_uri>
            <authentication_response_types>id_token</authentication_response_types>
            <authentication_request>
                <login_url>${SERVER_URL}/lti/login</login_url>
            </authentication_request>
            <redirect_uris>
                <redirect_uri>${SERVER_URL}/lti/launch</redirect_uri>
                <redirect_uri>${SERVER_URL}/lti/deep-linking</redirect_uri>
            </redirect_uris>
        </toolConfiguration>
        `;

        reply.header('Content-Type', 'application/xml');
        return reply.send(toolConfig);
    });

    // Handle OIDC login flow
    fastify.get<FastifyLtiRequest>('/lti/login', async (request: any, reply: any) => {
        try {
            // 1. Validate required parameters for OpenID Connect launch
            const { 
                iss, 
                login_hint, 
                target_link_uri, 
                client_id, 
                lti_message_hint, 
                lti_deployment_id 
            } = request.query as unknown as LtiLoginParams;

            if (!iss || !login_hint || !target_link_uri || !client_id) {
                return reply.status(400).send('Missing required parameters');
            }

            // 2. Find the platform configuration
            const platform = await findPlatform(iss, client_id, lti_deployment_id);
            if (!platform) {
                return reply.status(404).send('Platform not found. Please register the platform first.');
            }

            // 3. Generate state and nonce for security
            const state = crypto.randomBytes(16).toString('hex');
            const nonce = crypto.randomBytes(16).toString('hex');

            // 4. Store state for later validation
            await createState({
                state,
                nonce,
                platform_id: platform._id,
                target_link_uri,
                login_hint,
                lti_message_hint
            });

            // 5. Prepare the authentication request
            const authParams = new URLSearchParams({
                scope: 'openid',
                response_type: 'id_token',
                client_id,
                redirect_uri: target_link_uri,
                login_hint,
                state,
                nonce,
                prompt: 'none',
                response_mode: 'form_post'
            });

            if (lti_message_hint) {
                authParams.append('lti_message_hint', lti_message_hint);
            }

            // 6. Redirect to platform's authentication URL
            const authUrl = `${platform.auth_login_url}?${authParams.toString()}`;
            return reply.redirect(authUrl);
        } catch (error) {
            console.error('LTI login error:', error);
            return reply.status(500).send('Error processing LTI login');
        }
    });

    // Handle launch requests (both resource and deep linking)
    // Handle multiple route paths for both launch and deep linking
    ['/lti/launch', '/lti/deep-linking'].forEach(path => {
        fastify.post<FastifyLtiRequest>(path, async (request: any, reply: any) => {
        try {
            // 1. Validate the state and id_token parameters
            const { state, id_token } = request.body || {};
            if (!state || !id_token) {
                return reply.status(400).send('Missing state or id_token');
            }

            // 2. Retrieve and consume the state
            const storedState = await getAndConsumeState(state);
            if (!storedState) {
                return reply.status(400).send('Invalid or expired state');
            }

            // 3. Find the platform
            const platform = await findPlatform(
                storedState.platform_id.split('#')[0],
                storedState.platform_id.split('#')[1],
                storedState.platform_id.split('#')[2]
            );

            if (!platform) {
                return reply.status(404).send('Platform not found');
            }

            // 4. Fetch platform's JWKS to validate the token
            // Fetch platform's JWKS to validate the token
            await fetch(platform.key_set_url);
            // TODO: Implement token validation using JWK from platform

            // 5. Find the key used to sign the token
            // This is a simplified example - in production you'd want to use a JWKS library
            // such as jwks-rsa to handle this properly
            // Verify the token using keys from jwks.keys
            
            // 6. Verify the token
            let payload: LtiJwtPayload;
            try {
                // This is simplified; in production use a library to properly handle JWK validation
                payload = jwt.decode(id_token) as LtiJwtPayload;
                
                // In a real implementation, you would verify the signature using the JWK
                // jwt.verify(id_token, publicKey, { algorithms: ['RS256'] });
                
                // Also validate other claims:
                if (payload.nonce !== storedState.nonce) {
                    throw new Error('Nonce mismatch');
                }
                
                if (payload.iss !== platform.issuer) {
                    throw new Error('Issuer mismatch');
                }
                
                if (!payload.aud?.includes(platform.client_id)) {
                    throw new Error('Audience mismatch');
                }
            } catch (error) {
                console.error('Token validation error:', error);
                return reply.status(401).send('Invalid token');
            }

            // 7. Process the launch based on message type
            const messageType = payload['https://purl.imsglobal.org/spec/lti/claim/message_type'];
            
            if (messageType === LTI_MESSAGE_TYPES.RESOURCE_LINK) {
                // Handle regular resource link launch
                
                // 8. Create a session
                const sessionId = await storeSession({
                    platformId: platform._id,
                    userId: payload.sub,
                    roles: payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
                    context: payload['https://purl.imsglobal.org/spec/lti/claim/context'],
                    resource_link: payload['https://purl.imsglobal.org/spec/lti/claim/resource_link'],
                    custom: payload['https://purl.imsglobal.org/spec/lti/claim/custom']
                });
                
                // 9. Associate DID if available in custom params (or create/find one)
                let did = null;
                
                if (payload['https://purl.imsglobal.org/spec/lti/claim/custom']?.did) {
                    // Use provided DID from custom params
                    did = payload['https://purl.imsglobal.org/spec/lti/claim/custom'].did;
                } else {
                    // Check if we have a DID mapped for this user
                    did = await getDidForUser(platform._id, payload.sub);
                    
                    // If not, we could create one or just continue without a DID
                    if (!did) {
                        // This is where you could create a new DID for the user
                        // For now, we'll just continue without one
                    }
                }
                
                // 10. If we have a DID, update the session
                if (did) {
                    // Map the user to the DID for future use
                    await mapUserToDid(platform._id, payload.sub, did);
                    
                    // For a real implementation, you might want to:
                    // 1. Create a LearnCard credential for the session
                    // 2. Issue a credential for the LTI context if appropriate
                    
                    // For demo purposes:
                    // Initialize LearnCard for potential credential issuance
                    await getEmptyLearnCard();
                    // You could use LearnCard to issue a credential here
                }
                
                // 11. Redirect to the appropriate application page with session info
                // In a real app, you'd likely use a token or session cookie
                return reply.redirect(`/lti/app?session=${sessionId}`);
                
            } else if (messageType === LTI_MESSAGE_TYPES.DEEP_LINKING) {
                // Handle deep linking (content selection) launch
                const deepLinkingSettings = payload['https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'];
                
                // Store deep linking session
                const sessionId = await storeSession({
                    platformId: platform._id,
                    userId: payload.sub,
                    roles: payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
                    context: payload['https://purl.imsglobal.org/spec/lti/claim/context'],
                    deepLinkingSettings
                });
                
                // Redirect to the content selection interface
                return reply.redirect(`/lti/content-selection?session=${sessionId}`);
            } else {
                // Unsupported message type
                return reply.status(400).send(`Unsupported message type: ${messageType}`);
            }
            
        } catch (error) {
            console.error('LTI launch error:', error);
            return reply.status(500).send('Error processing LTI launch');
        }
        });
    });

    // API endpoint to register a platform (would normally be protected)
    fastify.post('/lti/register-platform', async (request, reply) => {
        try {
            const platformData = request.body;
            
            // Validate required fields
            const requiredFields = ['issuer', 'client_id', 'auth_login_url', 'auth_token_url', 'key_set_url'];
            for (const field of requiredFields) {
                if (!(platformData as any)[field]) {
                    return reply.status(400).send(`Missing required field: ${field}`);
                }
            }
            
            // Register or update the platform
            const result = await registerPlatform(platformData);
            
            return reply.status(200).send({
                success: true,
                message: 'Platform registered successfully',
                platformId: result.upsertedId || (platformData as any).issuer
            });
        } catch (error) {
            console.error('Platform registration error:', error);
            return reply.status(500).send('Error registering platform');
        }
    });

    // API endpoint for credential issuance via LTI
    fastify.post('/lti/issue-credential', async (request, reply) => {
        try {
            const { sessionId, credentialData } = request.body as { sessionId: string; credentialData: any };
            
            if (!sessionId || !credentialData) {
                return reply.status(400).send('Missing sessionId or credentialData');
            }
            
            // Retrieve the session
            const session = await getSession(sessionId);
            if (!session) {
                return reply.status(404).send('Session not found');
            }
            
            // Get the DID for the user
            const did = await getDidForUser(session.platformId, session.userId);
            if (!did) {
                return reply.status(400).send('No DID associated with this user');
            }
            
            // Initialize LearnCard
            // Initialize LearnCard for credential issuance
            await getEmptyLearnCard();
            
            // Prepare the credential
            const unsignedCredential = {
                '@context': [
                    'https://www.w3.org/2018/credentials/v1',
                    'https://purl.imsglobal.org/spec/lti/claim/context'
                ],
                type: ['VerifiableCredential', 'LtiCredential'],
                issuer: {
                    id: 'did:web:learncard.io'  // Would use a real DID in production
                },
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: did,
                    contextId: session.context?.id,
                    contextTitle: session.context?.title,
                    platformId: session.platformId,
                    role: session.roles[0],
                    ...credentialData
                }
            };
            
            // Issue the credential (simplified example)
            // In a real app, you'd use a properly initialized LearnCard with a signing key
            // const signedCredential = await learnCard.invoke.issueCredential(unsignedCredential);
            
            // For demo purposes, return the unsigned credential
            return reply.status(200).send({
                success: true,
                credential: unsignedCredential
            });
            
        } catch (error) {
            console.error('Credential issuance error:', error);
            return reply.status(500).send('Error issuing credential');
        }
    });
};

// App setup
export const app = Fastify();

app.register(fastifyCors);
app.register(ltiFastifyPlugin);

export default app;