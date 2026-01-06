/**
 * Webhook receiver endpoint for partner integrations
 * 
 * This is a public REST endpoint that receives webhooks from external platforms
 * (Teachable, Kajabi, Thinkific, Typeform, Zapier, etc.) and issues credentials.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UnsignedVC } from '@learncard/types';

import { readIntegrationById } from '@accesslayer/integration/read';
import { getProfileByEmail } from '@accesslayer/profile/read';
import { getBoostByUri } from '@accesslayer/boost/read';
import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { getSigningAuthoritiesForIntegration } from '@accesslayer/signing-authority/relationships/read';
import { renderBoostTemplate } from '@helpers/template.helpers';
import { sendBoost } from '@helpers/boost.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { injectObv3AlignmentsIntoCredentialForBoost } from '@services/skills-provider/inject';

// Get a nested value from an object using dot notation path
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[part];
    }

    return current;
};

// Apply field mappings to extract templateData from payload
const applyMappings = (
    payload: Record<string, unknown>,
    mappings: Array<{ sourceField: string; targetField: string }>
): Record<string, string> => {
    const templateData: Record<string, string> = {};

    for (const mapping of mappings) {
        const value = getNestedValue(payload, mapping.sourceField);

        if (value !== undefined && value !== null) {
            // Convert targetField name to variable format (camelCase)
            const varName = mapping.targetField
                .toLowerCase()
                .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
                .replace(/[^a-z0-9]/g, '');

            templateData[varName] = String(value);
        }
    }

    return templateData;
};

// Webhook request validator
const WebhookPayloadValidator = z.record(z.string(), z.unknown());

export const webhooksFastifyPlugin: FastifyPluginAsync = async (fastify) => {
    /**
     * POST /webhooks/:webhookId
     * 
     * Public endpoint to receive webhooks from external platforms.
     * The webhookId is derived from the integration ID and stored in boost metadata.
     */
    fastify.post<{
        Params: { webhookId: string };
        Body: Record<string, unknown>;
    }>('/webhooks/:webhookId', async (request, reply) => {
        const { webhookId } = request.params;
        const payload = request.body;

        console.log(`[Webhook] Received webhook for ${webhookId}:`, JSON.stringify(payload).slice(0, 500));

        try {
            // Validate payload is an object
            const validatedPayload = WebhookPayloadValidator.parse(payload);

            // Extract integration ID from webhook ID (format: wh_<integrationId>)
            if (!webhookId.startsWith('wh_')) {
                return reply.status(400).send({ 
                    error: 'Invalid webhook ID format',
                    details: 'Webhook ID should start with "wh_"'
                });
            }

            const integrationIdPrefix = webhookId.slice(3); // Remove 'wh_' prefix

            // Look up integration
            const integration = await readIntegrationById(integrationIdPrefix);

            if (!integration) {
                // Try to find by partial match (first 16 chars)
                console.log(`[Webhook] Integration not found for prefix: ${integrationIdPrefix}`);
                return reply.status(404).send({ 
                    error: 'Webhook not found',
                    details: 'No integration found for this webhook ID'
                });
            }

            // Get webhook config from integration
            const webhookConfig = integration.webhookConfig;

            if (!webhookConfig) {
                console.log(`[Webhook] No webhook config for integration: ${integration.id}`);
                return reply.status(400).send({
                    error: 'Webhook not configured',
                    message: 'This webhook has not been configured yet.',
                    received: {
                        webhookId,
                        integrationId: integration.id,
                        payloadFields: Object.keys(validatedPayload),
                    },
                    nextSteps: [
                        'Complete the onboarding wizard to configure field mappings',
                        'Ensure a boost template is associated with this integration'
                    ]
                });
            }

            if (webhookConfig.enabled === false) {
                return reply.status(400).send({
                    error: 'Webhook disabled',
                    message: 'This webhook is currently disabled.'
                });
            }

            // Validate required config
            if (!webhookConfig.boostUri) {
                return reply.status(400).send({
                    error: 'Webhook misconfigured',
                    message: 'No boost template associated with this webhook.'
                });
            }

            if (!webhookConfig.recipientEmailPath) {
                return reply.status(400).send({
                    error: 'Webhook misconfigured',
                    message: 'No recipient email field configured for this webhook.'
                });
            }

            // Extract recipient email from payload
            const recipientEmail = getNestedValue(validatedPayload, webhookConfig.recipientEmailPath);

            if (!recipientEmail || typeof recipientEmail !== 'string') {
                return reply.status(400).send({
                    error: 'Missing recipient email',
                    message: `Could not find email at path "${webhookConfig.recipientEmailPath}" in payload.`,
                    receivedFields: Object.keys(validatedPayload)
                });
            }

            // Validate email format
            if (!recipientEmail.includes('@')) {
                return reply.status(400).send({
                    error: 'Invalid recipient email',
                    message: `Value at "${webhookConfig.recipientEmailPath}" is not a valid email: ${recipientEmail}`
                });
            }

            console.log(`[Webhook] Processing credential for: ${recipientEmail}`);

            // Look up recipient profile by email
            const recipientProfile = await getProfileByEmail(recipientEmail);

            if (!recipientProfile) {
                // For now, we require the recipient to have a LearnCard profile
                // In the future, we could create a pending credential or send an invite
                return reply.status(400).send({
                    error: 'Recipient not found',
                    message: `No LearnCard profile found for email: ${recipientEmail}`,
                    suggestion: 'The recipient needs to create a LearnCard account with this email address first.'
                });
            }

            // Get the boost template
            const boost = await getBoostByUri(webhookConfig.boostUri);

            if (!boost) {
                console.error(`[Webhook] Boost not found: ${webhookConfig.boostUri}`);
                return reply.status(500).send({
                    error: 'Boost template not found',
                    message: 'The credential template associated with this webhook could not be found.'
                });
            }

            // Get the boost owner (issuer)
            const boostOwner = await getBoostOwner(boost);

            if (!boostOwner) {
                console.error(`[Webhook] Boost owner not found for: ${webhookConfig.boostUri}`);
                return reply.status(500).send({
                    error: 'Issuer not found',
                    message: 'Could not determine the issuer for this credential.'
                });
            }

            // Get signing authority for the integration
            const signingAuthorities = await getSigningAuthoritiesForIntegration(integration);
            const signingAuthority = signingAuthorities[0];

            if (!signingAuthority) {
                console.error(`[Webhook] No signing authority for integration: ${integration.id}`);
                return reply.status(500).send({
                    error: 'Signing authority not found',
                    message: 'No signing authority configured for this integration.'
                });
            }

            // Apply field mappings to create templateData
            const templateData = applyMappings(
                validatedPayload,
                webhookConfig.mappings || []
            );

            console.log(`[Webhook] Template data:`, templateData);

            // Get domain from environment or default
            const domain = process.env.DOMAIN || 'localhost:3000';

            // Render the boost template with mapped data
            let boostJsonString = boost.dataValues.boost;

            if (Object.keys(templateData).length > 0) {
                boostJsonString = renderBoostTemplate(boostJsonString, templateData);
            }

            // Parse the rendered credential
            const boostCredential = JSON.parse(boostJsonString) as UnsignedVC;

            // Set the issuer and subject
            boostCredential.issuer = signingAuthority.relationship.did;
            
            if (Array.isArray(boostCredential.credentialSubject)) {
                boostCredential.credentialSubject = boostCredential.credentialSubject.map(subject => ({
                    ...subject,
                    id: getDidWeb(domain, recipientProfile.profileId),
                }));
            } else {
                boostCredential.credentialSubject.id = getDidWeb(domain, recipientProfile.profileId);
            }

            // Inject OBv3 skill alignments
            await injectObv3AlignmentsIntoCredentialForBoost(boostCredential, boost, domain);

            // Issue the credential
            const vc = await issueCredentialWithSigningAuthority(
                boostOwner,
                boostCredential,
                signingAuthority,
                domain,
                false
            );

            // Send the boost to recipient
            const credentialUri = await sendBoost({
                from: boostOwner,
                to: recipientProfile,
                boost,
                credential: vc,
                domain,
                skipNotification: false,
                autoAcceptCredential: true,
            });

            console.log(`[Webhook] Credential issued successfully: ${credentialUri}`);

            return reply.status(200).send({
                success: true,
                message: 'Credential issued successfully',
                credentialUri,
                recipient: recipientEmail,
                templateData,
            });

        } catch (error) {
            console.error('[Webhook] Error processing webhook:', error);

            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid payload',
                    details: error.issues
                });
            }

            return reply.status(500).send({
                error: 'Internal server error',
                message: 'Failed to process webhook'
            });
        }
    });

    /**
     * GET /webhooks/:webhookId/test
     * 
     * Test endpoint to verify webhook URL is reachable
     */
    fastify.get<{
        Params: { webhookId: string };
    }>('/webhooks/:webhookId/test', async (request, reply) => {
        const { webhookId } = request.params;

        return reply.send({
            status: 'ok',
            message: 'Webhook endpoint is reachable',
            webhookId,
            timestamp: new Date().toISOString(),
            instructions: 'Send a POST request to this URL with your JSON payload to trigger credential issuance'
        });
    });

    /**
     * GET /webhooks/health
     * 
     * Health check for webhook service
     */
    fastify.get('/webhooks/health', async (_request, reply) => {
        return reply.send({
            status: 'healthy',
            service: 'webhooks',
            timestamp: new Date().toISOString()
        });
    });
};
