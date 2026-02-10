/**
 * Ed.link Polling Service
 *
 * Polls Ed.link for new assignment completions and automatically issues
 * credentials to students via Universal Inbox.
 *
 * POC Simplification: Uses a hardcoded seed for signing credentials,
 * removing the need for users to configure signing authorities.
 */

import type { UnsignedVC, VC } from '@learncard/types';
import { getEdlinkConnectionsWithAutoIssue, getEdlinkConnectionById } from '@accesslayer/edlink-connection';
import { updateEdlinkConnectionLastPolled } from '@accesslayer/edlink-connection/update';
import {
    hasSubmissionBeenIssued,
    createEdlinkIssuedCredential,
} from '@accesslayer/edlink-issued-credential';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { createProfile } from '@accesslayer/profile/create';
import { getEdlinkCompletions, createAssignmentCompletionCredential } from '@helpers/edlink.helpers';
import { issueToInbox } from '@helpers/inbox.helpers';
import { getLearnCard, SeedLearnCard } from '@helpers/learnCard.helpers';
import type { Context } from '@routes';

// Domain for generating credential URIs (matches other brain-service code)
const DOMAIN = process.env.DOMAIN_NAME || 'localhost:4000';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// POC: Hardcoded issuer seed - in production, use proper signing authorities
const EDLINK_ISSUER_SEED = process.env.EDLINK_ISSUER_SEED || 'a'.repeat(64);
const EDLINK_ISSUER_PROFILE_ID = 'edlink-system-issuer';

let issuerLearnCard: SeedLearnCard | null = null;

/**
 * Get or create the issuer LearnCard instance.
 */
async function getIssuerLearnCard(): Promise<SeedLearnCard> {
    if (!issuerLearnCard) {
        issuerLearnCard = await getLearnCard(EDLINK_ISSUER_SEED);
    }
    return issuerLearnCard;
}

/**
 * Reset cached issuer LearnCard (for testing only).
 */
export function resetIssuerLearnCard(): void {
    issuerLearnCard = null;
}

/**
 * Ensure the system issuer profile exists.
 * Creates it if it doesn't exist (one-time setup).
 */
async function ensureIssuerProfile(): Promise<{ profileId: string; did: string }> {
    const learnCard = await getIssuerLearnCard();
    const did = learnCard.id.did();

    let profile = await getProfileByProfileId(EDLINK_ISSUER_PROFILE_ID);

    if (!profile) {
        console.log('[Edlink Polling] Creating system issuer profile...');
        profile = await createProfile({
            profileId: EDLINK_ISSUER_PROFILE_ID,
            did,
            displayName: 'Ed.link System Issuer',
            shortBio: 'System issuer for Ed.link credential issuance',
            bio: 'This is an automated system profile used for issuing credentials from Ed.link LMS integrations.',
            isServiceProfile: true,
        });
    }

    return { profileId: profile.profileId, did: profile.did };
}

/**
 * Starts the Ed.link polling service.
 * Only starts if EDLINK_POLLING_ENABLED environment variable is 'true'.
 */
export const startEdlinkPolling = (): void => {
    if (process.env.EDLINK_POLLING_ENABLED !== 'true') {
        console.log('[Edlink Polling] Disabled (EDLINK_POLLING_ENABLED !== "true")');
        return;
    }

    console.log('[Edlink Polling] Starting with interval:', POLL_INTERVAL_MS / 1000, 'seconds');

    // Run immediately on startup, then set interval
    processEdlinkCompletions().catch(err => {
        console.error('[Edlink Polling] Initial poll error:', err);
    });

    setInterval(() => {
        processEdlinkCompletions().catch(err => {
            console.error('[Edlink Polling] Poll error:', err);
        });
    }, POLL_INTERVAL_MS);
};

/**
 * Process all connections with auto-issuance enabled.
 * Exported for testing purposes.
 */
export async function processEdlinkCompletions(): Promise<void> {
    const connections = await getEdlinkConnectionsWithAutoIssue();

    if (connections.length === 0) {
        console.log('[Edlink Polling] No connections with auto-issuance enabled');
        return;
    }

    console.log(`[Edlink Polling] Processing ${connections.length} connections`);

    for (const connection of connections) {
        try {
            await processConnection(connection);
        } catch (error) {
            console.error(
                `[Edlink Polling] Error processing connection ${connection.dataValues.id}:`,
                error
            );
        }
    }
}

/**
 * Process a single connection by ID.
 * Used for instant issuance when auto-issue is enabled.
 */
export async function processConnectionById(connectionId: string): Promise<{
    issued: number;
    skipped: number;
    failed: number;
}> {
    const connection = await getEdlinkConnectionById(connectionId);
    if (!connection) {
        throw new Error('Connection not found');
    }

    return processConnection(connection);
}

/**
 * Process a single connection: fetch completions and issue credentials.
 * POC: Uses system issuer profile and seed-based signing.
 */
async function processConnection(connection: Awaited<ReturnType<typeof getEdlinkConnectionsWithAutoIssue>>[0]): Promise<{
    issued: number;
    skipped: number;
    failed: number;
}> {
    const { id: connectionId, accessToken, institutionName } = connection.dataValues;

    console.log(`[Edlink Polling] Processing connection ${connectionId} (${institutionName})`);

    // Get issuer LearnCard and ensure profile exists
    const learnCard = await getIssuerLearnCard();
    const issuerProfile = await ensureIssuerProfile();

    // Fetch completions from Ed.link
    const completions = await getEdlinkCompletions(accessToken);
    console.log(`[Edlink Polling] Found ${completions.assignmentCompletions.length} assignment completions`);

    let issuedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Process each assignment completion
    for (const completion of completions.assignmentCompletions) {
        try {
            // Skip if no email
            if (!completion.personEmail) {
                await createEdlinkIssuedCredential({
                    connectionId,
                    submissionId: completion.submissionId,
                    assignmentId: completion.assignmentId,
                    studentEmail: 'no-email',
                    studentName: completion.personName,
                    className: completion.className,
                    assignmentTitle: completion.assignmentTitle,
                    grade: completion.grade ?? undefined,
                    issuedAt: new Date().toISOString(),
                    status: 'SKIPPED',
                    errorMessage: 'No email address for student',
                });
                skippedCount++;
                continue;
            }

            // Skip if already issued
            const alreadyIssued = await hasSubmissionBeenIssued(connectionId, completion.submissionId);
            if (alreadyIssued) {
                continue;
            }

            // Create unsigned credential with system issuer
            console.log(`[Edlink Polling] Creating credential for ${completion.personEmail}...`);
            const unsignedCredential = createAssignmentCompletionCredential(
                completion,
                issuerProfile.did
            ) as UnsignedVC;
            console.log(`[Edlink Polling] Unsigned credential created:`, JSON.stringify(unsignedCredential, null, 2));

            // Sign the credential directly with our seed-based LearnCard
            console.log(`[Edlink Polling] Signing credential with issuer DID: ${issuerProfile.did}`);
            const signedCredential = await learnCard.invoke.issueCredential(unsignedCredential) as VC;
            console.log(`[Edlink Polling] Credential signed successfully`);

            // Create context for issueToInbox
            const ctx: Context = { domain: DOMAIN };
            console.log(`[Edlink Polling] Issuing to inbox for ${completion.personEmail} (domain: ${DOMAIN})`);

            // Issue to inbox - this handles email notifications for new users
            const inboxResult = await issueToInbox(
                issuerProfile as any,
                { type: 'email', value: completion.personEmail },
                signedCredential,
                {}, // no special configuration needed
                ctx
            );

            console.log(`[Edlink Polling] Inbox result:`, {
                status: inboxResult.status,
                claimUrl: inboxResult.claimUrl,
                recipientDid: inboxResult.recipientDid,
                inboxCredentialId: inboxResult.inboxCredential?.id,
            });

            // Record success
            await createEdlinkIssuedCredential({
                connectionId,
                submissionId: completion.submissionId,
                assignmentId: completion.assignmentId,
                studentEmail: completion.personEmail,
                studentName: completion.personName,
                className: completion.className,
                assignmentTitle: completion.assignmentTitle,
                grade: completion.grade ?? undefined,
                issuedAt: new Date().toISOString(),
                status: 'ISSUED',
            });

            issuedCount++;
            console.log(
                `[Edlink Polling] ✅ Issued credential to ${completion.personEmail} for "${completion.assignmentTitle}"`
            );
            if (inboxResult.claimUrl) {
                console.log(`[Edlink Polling] 🔗 Claim URL: ${inboxResult.claimUrl}`);
            }
        } catch (error) {
            // Record failure
            await createEdlinkIssuedCredential({
                connectionId,
                submissionId: completion.submissionId,
                assignmentId: completion.assignmentId,
                studentEmail: completion.personEmail || 'unknown',
                studentName: completion.personName,
                className: completion.className,
                assignmentTitle: completion.assignmentTitle,
                grade: completion.grade ?? undefined,
                issuedAt: new Date().toISOString(),
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
            failedCount++;
            console.error(
                `[Edlink Polling] Failed to issue credential for ${completion.personEmail}:`,
                error
            );
        }
    }

    // Update last polled timestamp
    await updateEdlinkConnectionLastPolled(connectionId, new Date().toISOString());

    console.log(
        `[Edlink Polling] Connection ${connectionId}: issued=${issuedCount}, skipped=${skippedCount}, failed=${failedCount}`
    );

    return { issued: issuedCount, skipped: skippedCount, failed: failedCount };
}

export default { startEdlinkPolling };
