import { useEffect, useCallback, useRef } from 'react';
import type { AppEvent, SendCredentialEvent } from '@learncard/types';

import sdkActivityStore from '../../stores/sdkActivityStore';

// Re-export for convenience
export type { AppEvent, SendCredentialEvent };

// ============================================================================
// Types & Protocol Definition
// ============================================================================

export const LEARNCARD_PROTOCOL = 'LEARNCARD_V1' as const;

export type LearnCardAction =
    | 'REQUEST_IDENTITY'
    | 'REQUEST_CONSENT'
    | 'SEND_CREDENTIAL'
    | 'ASK_CREDENTIAL_SPECIFIC'
    | 'ASK_CREDENTIAL_SEARCH'
    | 'LAUNCH_FEATURE'
    | 'INITIATE_TEMPLATE_ISSUE'
    | 'APP_EVENT';

export type ResponseType = 'SUCCESS' | 'ERROR';

export type ErrorCode =
    | 'LC_UNAUTHENTICATED'
    | 'USER_REJECTED'
    | 'INVALID_PAYLOAD'
    | 'CREDENTIAL_NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'UNKNOWN_ERROR';

// Incoming message structure
export interface LearnCardMessage {
    protocol: typeof LEARNCARD_PROTOCOL;
    action: LearnCardAction;
    requestId: string;
    payload?: any;
}

// Outgoing response structure
export interface LearnCardResponse {
    protocol: typeof LEARNCARD_PROTOCOL;
    requestId: string;
    type: ResponseType;
    data?: any;
    error?: {
        code: ErrorCode;
        message: string;
    };
}

// ============================================================================
// Action Payload Type Definitions
// ============================================================================

export interface RequestIdentityPayload {
    challenge?: string;
    appName?: string; // Optional app name for consent modal
}

export interface RequestConsentPayload {
    contractUri: string;
    redirect?: boolean;
}

export interface SendCredentialPayload {
    credential: any;
}

export interface AskCredentialSpecificPayload {
    credentialId: string;
}

export interface VerifiablePresentationRequest {
    query: Array<{
        type: 'QueryByExample';
        credentialQuery: {
            reason: string;
            example: {
                '@context': string[];
                type: string | string[];
                [key: string]: any;
            };
        };
    }>;
    challenge?: string;
    domain?: string;
}

export interface AskCredentialSearchPayload {
    verifiablePresentationRequest: VerifiablePresentationRequest;
}

export interface LaunchFeaturePayload {
    featurePath: string;
    params?: Record<string, string>;
}

export interface InitiateTemplateIssuePayload {
    templateId: string; // The boost ID/template to issue
    draftRecipients?: string[]; // Optional list of profile IDs/DIDs
}

// AppEvent and SendCredentialEvent are imported from @learncard/types above

export type AppEventPayload = AppEvent;

/**
 * Maps each action type to its expected payload type
 */
export interface ActionPayloadMap {
    REQUEST_IDENTITY: RequestIdentityPayload;
    REQUEST_CONSENT: RequestConsentPayload;
    SEND_CREDENTIAL: SendCredentialPayload;
    ASK_CREDENTIAL_SPECIFIC: AskCredentialSpecificPayload;
    ASK_CREDENTIAL_SEARCH: AskCredentialSearchPayload;
    LAUNCH_FEATURE: LaunchFeaturePayload;
    INITIATE_TEMPLATE_ISSUE: InitiateTemplateIssuePayload;
    APP_EVENT: AppEventPayload;
}

// ============================================================================
// Action Handlers Type Definitions
// ============================================================================

export interface ActionContext<T extends LearnCardAction = LearnCardAction> {
    origin: string;
    source: MessageEventSource;
    payload: ActionPayloadMap[T];
}

export type ActionHandler<T extends LearnCardAction = LearnCardAction> = (
    context: ActionContext<T>
) => Promise<
    { success: true; data?: any } | { success: false; error: { code: ErrorCode; message: string } }
>;

export interface ActionHandlers {
    REQUEST_IDENTITY?: ActionHandler<'REQUEST_IDENTITY'>;
    REQUEST_CONSENT?: ActionHandler<'REQUEST_CONSENT'>;
    SEND_CREDENTIAL?: ActionHandler<'SEND_CREDENTIAL'>;
    ASK_CREDENTIAL_SPECIFIC?: ActionHandler<'ASK_CREDENTIAL_SPECIFIC'>;
    ASK_CREDENTIAL_SEARCH?: ActionHandler<'ASK_CREDENTIAL_SEARCH'>;
    LAUNCH_FEATURE?: ActionHandler<'LAUNCH_FEATURE'>;
    INITIATE_TEMPLATE_ISSUE?: ActionHandler<'INITIATE_TEMPLATE_ISSUE'>;
    APP_EVENT?: ActionHandler<'APP_EVENT'>;
}

// ============================================================================
// Configuration
// ============================================================================

export interface UseLearnCardPostMessageConfig {
    /**
     * List of trusted origins that are allowed to send messages.
     * CRITICAL SECURITY: Only add domains you trust.
     */
    trustedOrigins: string[];

    /**
     * Action handlers for each supported action type.
     */
    handlers: ActionHandlers;

    /**
     * Optional: Enable debug logging
     */
    debug?: boolean;
}

// ============================================================================
// Response Utility
// ============================================================================

function sendResponse(
    targetWindow: MessageEventSource,
    targetOrigin: string,
    requestId: string,
    type: ResponseType,
    data?: any,
    error?: { code: ErrorCode; message: string }
): void {
    const response: LearnCardResponse = {
        protocol: LEARNCARD_PROTOCOL,
        requestId,
        type,
        ...(data && { data }),
        ...(error && { error }),
    };

    // Type assertion needed because postMessage expects Window but we have MessageEventSource
    (targetWindow as Window).postMessage(response, targetOrigin);
}

// ============================================================================
// Validation Functions
// ============================================================================

function isValidLearnCardMessage(event: MessageEvent): event is MessageEvent<LearnCardMessage> {
    const data = event.data;

    // Check if it's an object
    if (!data || typeof data !== 'object') return false;

    // Check protocol
    if (data.protocol !== LEARNCARD_PROTOCOL) return false;

    // Check required fields
    if (!data.action || typeof data.action !== 'string') return false;
    if (!data.requestId || typeof data.requestId !== 'string') return false;

    return true;
}

function isTrustedOrigin(origin: string, trustedOrigins: string[]): boolean {
    return trustedOrigins.includes(origin);
}

// ============================================================================
// Main Hook
// ============================================================================

export function useLearnCardPostMessage(config: UseLearnCardPostMessageConfig) {
    const { trustedOrigins, handlers, debug = false } = config;
    const handlersRef = useRef(handlers);

    // Update handlers ref when they change
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    const handleMessage = useCallback(
        async (event: MessageEvent) => {
            // ================================================================
            // Step 1: Security & Protocol Validation
            // ================================================================

            if (debug) {
                //console.log('[LearnCard PostMessage] Received message:', event);
            }

            // Validate message structure and protocol
            if (!isValidLearnCardMessage(event)) {
                //if (debug) {
                //    console.log('[LearnCard PostMessage] Invalid message format, ignoring');
                //}
                return;
            }

            // CRITICAL SECURITY: Check origin
            if (!isTrustedOrigin(event.origin, trustedOrigins)) {
                console.warn(
                    `[LearnCard PostMessage] Rejected message from untrusted origin: ${event.origin}`
                );
                return;
            }

            const { action, requestId, payload } = event.data;

            if (debug) {
                console.log(
                    `[LearnCard PostMessage] Processing action: ${action}, requestId: ${requestId}`
                );
            }

            // ================================================================
            // Step 2: Route to Action Handler
            // ================================================================

            const handler = handlersRef.current[action];

            if (!handler) {
                console.warn(`[LearnCard PostMessage] No handler registered for action: ${action}`);
                sendResponse(event.source!, event.origin, requestId, 'ERROR', undefined, {
                    code: 'UNKNOWN_ERROR',
                    message: `No handler registered for action: ${action}`,
                });
                return;
            }

            // ================================================================
            // Step 3: Execute Handler & Send Response
            // ================================================================

            // Show activity indicator while processing
            sdkActivityStore.set.startActivity();

            try {
                const result = await handler({
                    origin: event.origin,
                    source: event.source!,
                    payload,
                });

                if (result.success) {
                    if (debug) {
                        console.log(
                            `[LearnCard PostMessage] Action ${action} succeeded:`,
                            result.data
                        );
                    }
                    sendResponse(event.source!, event.origin, requestId, 'SUCCESS', result.data);
                } else {
                    if (debug) {
                        console.log(
                            `[LearnCard PostMessage] Action ${action} failed:`,
                            result.error
                        );
                    }
                    sendResponse(
                        event.source!,
                        event.origin,
                        requestId,
                        'ERROR',
                        undefined,
                        result.error
                    );
                }
            } catch (error) {
                console.error(`[LearnCard PostMessage] Error handling action ${action}:`, error);
                sendResponse(event.source!, event.origin, requestId, 'ERROR', undefined, {
                    code: 'UNKNOWN_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                });
                // Hide activity indicator on error
                sdkActivityStore.set.endActivity();
            }
            // Note: endActivity() is called by handlers when they show their UI
        },
        [trustedOrigins, debug]
    );

    // ================================================================
    // Step 4: Register Global Listener
    // ================================================================

    useEffect(() => {
        if (debug) {
            console.log('[LearnCard PostMessage] Registering message listener');
        }

        window.addEventListener('message', handleMessage);

        return () => {
            if (debug) {
                console.log('[LearnCard PostMessage] Unregistering message listener');
            }
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage, debug]);

    return {
        // Could expose utility functions here if needed
    };
}
