/**
 * Ed.link Auto-Issuance Tests
 *
 * These tests verify the Ed.link LMS integration functionality including:
 * 1. EdlinkConnection updates (owner, auto-issue toggle, last polled)
 * 2. EdlinkIssuedCredential CRUD operations (create, read, deduplication)
 * 3. Credential template generation helper
 * 4. tRPC routes for managing auto-issuance
 */
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from 'vitest';
import { v4 as uuid } from 'uuid';

import { getUser } from './helpers/getClient';

import { EdlinkConnection, EdlinkIssuedCredential, Profile } from '@models';
import { createEdlinkConnection } from '@accesslayer/edlink-connection/create';
import { getEdlinkConnectionById } from '@accesslayer/edlink-connection/read';
import {
    updateEdlinkConnectionAutoIssue,
    updateEdlinkConnectionOwner,
    updateEdlinkConnectionLastPolled,
} from '@accesslayer/edlink-connection/update';
import {
    createEdlinkIssuedCredential,
    hasSubmissionBeenIssued,
    getIssuedCredentialsForConnection,
    countIssuedCredentialsForConnection,
} from '@accesslayer/edlink-issued-credential';
import { createAssignmentCompletionCredential } from '@helpers/edlink.helpers';
import type { EdlinkAssignmentCompletion } from '@learncard/types';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

// Helper to create a test connection
const makeTestConnection = (overrides?: Partial<Parameters<typeof createEdlinkConnection>[0]>) => ({
    id: uuid(),
    integrationId: uuid(),
    sourceId: uuid(),
    accessToken: 'test-token-' + uuid(),
    provider: 'canvas',
    providerName: 'Canvas LMS',
    institutionName: 'Test University',
    status: 'CONNECTED', // Must match EdlinkConnectionStatusEnum
    connectedAt: new Date().toISOString(),
    ...overrides,
});

// Helper to create test completion data
const makeTestCompletion = (overrides?: Partial<EdlinkAssignmentCompletion>): EdlinkAssignmentCompletion => ({
    classId: 'class-' + uuid(),
    assignmentId: 'assignment-' + uuid(),
    submissionId: 'submission-' + uuid(),
    personId: 'person-' + uuid(),
    className: 'Introduction to Testing',
    assignmentTitle: 'Unit Test Assignment',
    personName: 'Test Student',
    personEmail: 'student@test.edu',
    gradedDate: new Date().toISOString(),
    grade: 95,
    ...overrides,
});

const seedProfile = async (user: Awaited<ReturnType<typeof getUser>>, profileId: string) => {
    await user.clients.fullAuth.profile.createProfile({ profileId });
};

describe('Ed.link Auto-Issuance', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
    });

    // ==========================================================================
    // Access Layer: EdlinkConnection Updates
    // ==========================================================================
    describe('Access Layer: EdlinkConnection Updates', () => {
        beforeEach(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });
        });

        it('updates auto-issue setting on connection', async () => {
            // Create a connection with auto-issue disabled by default
            const connData = makeTestConnection();
            await createEdlinkConnection(connData);

            // Verify initial state (no autoIssueCredentials set)
            const initial = await EdlinkConnection.findOne({ where: { id: connData.id } });
            expect(initial?.dataValues.autoIssueCredentials).toBeFalsy();

            // Enable auto-issuance
            const updated = await updateEdlinkConnectionAutoIssue(connData.id, true);
            expect(updated?.dataValues.autoIssueCredentials).toBe(true);

            // Disable auto-issuance
            const disabled = await updateEdlinkConnectionAutoIssue(connData.id, false);
            expect(disabled?.dataValues.autoIssueCredentials).toBe(false);
        });

        it('updates owner profile ID on connection', async () => {
            const connData = makeTestConnection();
            await createEdlinkConnection(connData);

            // Initial state has no owner
            const initial = await EdlinkConnection.findOne({ where: { id: connData.id } });
            expect(initial?.dataValues.ownerProfileId).toBeUndefined();

            // Set owner
            const updated = await updateEdlinkConnectionOwner(connData.id, 'profile-owner-123');
            expect(updated?.dataValues.ownerProfileId).toBe('profile-owner-123');
        });

        it('updates last polled timestamp on connection', async () => {
            const connData = makeTestConnection();
            await createEdlinkConnection(connData);

            const timestamp = new Date().toISOString();
            const updated = await updateEdlinkConnectionLastPolled(connData.id, timestamp);

            expect(updated?.dataValues.lastPolledAt).toBe(timestamp);
        });

        it('returns null when updating non-existent connection', async () => {
            const result = await updateEdlinkConnectionAutoIssue('non-existent-id', true);
            expect(result).toBeNull();
        });
    });

    // ==========================================================================
    // Access Layer: EdlinkIssuedCredential CRUD
    // ==========================================================================
    describe('Access Layer: EdlinkIssuedCredential CRUD', () => {
        let testConnectionId: string;

        beforeEach(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });

            // Create a connection for testing issued credentials
            const connData = makeTestConnection();
            testConnectionId = connData.id;
            await createEdlinkConnection(connData);
        });

        afterAll(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });
        });

        it('creates an issued credential record with relationship to connection', async () => {
            const completion = makeTestCompletion();

            const created = await createEdlinkIssuedCredential({
                connectionId: testConnectionId,
                submissionId: completion.submissionId,
                assignmentId: completion.assignmentId,
                studentEmail: completion.personEmail!,
                studentName: completion.personName,
                className: completion.className,
                assignmentTitle: completion.assignmentTitle,
                grade: completion.grade ?? undefined,
                issuedAt: new Date().toISOString(),
                status: 'ISSUED',
            });

            expect(created.id).toBeTruthy();
            expect(created.dataValues.submissionId).toBe(completion.submissionId);
            expect(created.dataValues.status).toBe('ISSUED');
            expect(created.dataValues.connectionId).toBe(testConnectionId);
        });

        it('throws error when creating issued credential for non-existent connection', async () => {
            const completion = makeTestCompletion();

            await expect(
                createEdlinkIssuedCredential({
                    connectionId: 'non-existent-connection',
                    submissionId: completion.submissionId,
                    assignmentId: completion.assignmentId,
                    studentEmail: completion.personEmail!,
                    studentName: completion.personName,
                    className: completion.className,
                    assignmentTitle: completion.assignmentTitle,
                    issuedAt: new Date().toISOString(),
                    status: 'ISSUED',
                })
            ).rejects.toThrow('EdlinkConnection not found');
        });

        it('detects duplicate submissions via hasSubmissionBeenIssued', async () => {
            const completion = makeTestCompletion();

            // Initially, submission hasn't been issued
            const beforeIssue = await hasSubmissionBeenIssued(testConnectionId, completion.submissionId);
            expect(beforeIssue).toBe(false);

            // Create the issued credential
            await createEdlinkIssuedCredential({
                connectionId: testConnectionId,
                submissionId: completion.submissionId,
                assignmentId: completion.assignmentId,
                studentEmail: completion.personEmail!,
                studentName: completion.personName,
                className: completion.className,
                assignmentTitle: completion.assignmentTitle,
                issuedAt: new Date().toISOString(),
                status: 'ISSUED',
            });

            // Now it should be detected as already issued
            const afterIssue = await hasSubmissionBeenIssued(testConnectionId, completion.submissionId);
            expect(afterIssue).toBe(true);

            // Different submission ID should still return false
            const differentSubmission = await hasSubmissionBeenIssued(testConnectionId, 'other-submission-id');
            expect(differentSubmission).toBe(false);

            // Same submission ID on different connection should return false
            const connData2 = makeTestConnection();
            await createEdlinkConnection(connData2);
            const differentConnection = await hasSubmissionBeenIssued(connData2.id, completion.submissionId);
            expect(differentConnection).toBe(false);
        });

        it('retrieves issued credentials for a connection with pagination', async () => {
            // Create 5 issued credentials
            for (let i = 0; i < 5; i++) {
                const completion = makeTestCompletion();
                await createEdlinkIssuedCredential({
                    connectionId: testConnectionId,
                    submissionId: completion.submissionId,
                    assignmentId: completion.assignmentId,
                    studentEmail: completion.personEmail!,
                    studentName: `Student ${i + 1}`,
                    className: completion.className,
                    assignmentTitle: completion.assignmentTitle,
                    issuedAt: new Date(Date.now() - i * 1000).toISOString(), // Stagger times
                    status: 'ISSUED',
                });
            }

            // Get all records
            const all = await getIssuedCredentialsForConnection(testConnectionId);
            expect(all.length).toBe(5);

            // Verify ordering (most recent first)
            expect(all[0]?.dataValues.studentName).toBe('Student 1');
            expect(all[4]?.dataValues.studentName).toBe('Student 5');

            // Test pagination
            const firstPage = await getIssuedCredentialsForConnection(testConnectionId, {
                limit: 2,
                offset: 0,
            });
            expect(firstPage.length).toBe(2);

            const secondPage = await getIssuedCredentialsForConnection(testConnectionId, {
                limit: 2,
                offset: 2,
            });
            expect(secondPage.length).toBe(2);

            const thirdPage = await getIssuedCredentialsForConnection(testConnectionId, {
                limit: 2,
                offset: 4,
            });
            expect(thirdPage.length).toBe(1);
        });

        it('counts issued credentials for a connection', async () => {
            // Initially zero
            const initialCount = await countIssuedCredentialsForConnection(testConnectionId);
            expect(initialCount).toBe(0);

            // Create some issued credentials
            for (let i = 0; i < 3; i++) {
                const completion = makeTestCompletion();
                await createEdlinkIssuedCredential({
                    connectionId: testConnectionId,
                    submissionId: completion.submissionId,
                    assignmentId: completion.assignmentId,
                    studentEmail: completion.personEmail!,
                    studentName: completion.personName,
                    className: completion.className,
                    assignmentTitle: completion.assignmentTitle,
                    issuedAt: new Date().toISOString(),
                    status: 'ISSUED',
                });
            }

            const afterCount = await countIssuedCredentialsForConnection(testConnectionId);
            expect(afterCount).toBe(3);
        });

        it('tracks different statuses (ISSUED, FAILED, SKIPPED)', async () => {
            const statuses: Array<'ISSUED' | 'FAILED' | 'SKIPPED'> = ['ISSUED', 'FAILED', 'SKIPPED'];

            for (const status of statuses) {
                const completion = makeTestCompletion();
                await createEdlinkIssuedCredential({
                    connectionId: testConnectionId,
                    submissionId: completion.submissionId,
                    assignmentId: completion.assignmentId,
                    studentEmail: completion.personEmail!,
                    studentName: completion.personName,
                    className: completion.className,
                    assignmentTitle: completion.assignmentTitle,
                    issuedAt: new Date().toISOString(),
                    status,
                    errorMessage: status === 'FAILED' ? 'Test error message' : undefined,
                });
            }

            const all = await getIssuedCredentialsForConnection(testConnectionId);
            expect(all.length).toBe(3);

            const statusValues = all.map(r => r.dataValues.status);
            expect(statusValues).toContain('ISSUED');
            expect(statusValues).toContain('FAILED');
            expect(statusValues).toContain('SKIPPED');

            const failedRecord = all.find(r => r.dataValues.status === 'FAILED');
            expect(failedRecord?.dataValues.errorMessage).toBe('Test error message');
        });
    });

    // ==========================================================================
    // Helper: Credential Template Generation
    // ==========================================================================
    describe('Helper: createAssignmentCompletionCredential', () => {
        it('creates an OpenBadgeCredential with correct structure', () => {
            const completion = makeTestCompletion({ grade: 95 });
            const issuerDid = 'did:web:example.com:teacher';

            const credential = createAssignmentCompletionCredential(completion, issuerDid);

            // Verify structure
            expect(credential['@context']).toContain('https://www.w3.org/2018/credentials/v1');
            expect(credential['@context']).toContain(
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json'
            );
            expect(credential.type).toContain('VerifiableCredential');
            expect(credential.type).toContain('OpenBadgeCredential');
            expect(credential.issuer).toBe(issuerDid);
            expect(credential.name).toBe(`Assignment Completed: ${completion.assignmentTitle}`);
        });

        it('includes achievement with correct metadata', () => {
            const completion = makeTestCompletion({
                assignmentTitle: 'Final Exam',
                className: 'Advanced Mathematics',
            });

            const credential = createAssignmentCompletionCredential(completion, 'did:web:test');
            const subject = credential.credentialSubject as Record<string, unknown>;
            const achievement = subject.achievement as Record<string, unknown>;

            expect(achievement.name).toBe('Final Exam');
            expect(achievement.description).toContain('Final Exam');
            expect(achievement.description).toContain('Advanced Mathematics');
            expect(achievement.type).toContain('Achievement');
        });

        it('includes grade percentage in result when grade is provided', () => {
            const completion = makeTestCompletion({ grade: 87 });

            const credential = createAssignmentCompletionCredential(completion, 'did:web:test');
            const subject = credential.credentialSubject as Record<string, unknown>;
            const results = subject.result as Array<Record<string, unknown>>;

            expect(results[0]?.value).toBe('87%');
        });

        it('shows "Completed" when grade is null', () => {
            const completion = makeTestCompletion({ grade: null });

            const credential = createAssignmentCompletionCredential(completion, 'did:web:test');
            const subject = credential.credentialSubject as Record<string, unknown>;
            const results = subject.result as Array<Record<string, unknown>>;

            expect(results[0]?.value).toBe('Completed');
        });

        it('shows "Completed" when grade is undefined', () => {
            const completion = makeTestCompletion();
            delete (completion as Record<string, unknown>).grade;

            const credential = createAssignmentCompletionCredential(completion, 'did:web:test');
            const subject = credential.credentialSubject as Record<string, unknown>;
            const results = subject.result as Array<Record<string, unknown>>;

            expect(results[0]?.value).toBe('Completed');
        });

        it('handles grade of 0 correctly', () => {
            const completion = makeTestCompletion({ grade: 0 });

            const credential = createAssignmentCompletionCredential(completion, 'did:web:test');
            const subject = credential.credentialSubject as Record<string, unknown>;
            const results = subject.result as Array<Record<string, unknown>>;

            expect(results[0]?.value).toBe('0%');
        });
    });

    // ==========================================================================
    // Routes: Ed.link Auto-Issuance Management
    // ==========================================================================
    describe('Routes: Ed.link Auto-Issuance Management', () => {
        let testConnectionId: string;

        beforeAll(async () => {
            userA = await getUser('a'.repeat(64));
            userB = await getUser('b'.repeat(64));
        });

        beforeEach(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });

            await seedProfile(userA, 'usera');
            await seedProfile(userB, 'userb');

            // Create a test connection
            const connData = makeTestConnection();
            testConnectionId = connData.id;
            await createEdlinkConnection(connData);
        });

        afterAll(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
        });

        describe('setOwner', () => {
            it('sets the owner profile ID for a connection', async () => {
                const result = await userA.clients.fullAuth.edlink.setOwner({
                    connectionId: testConnectionId,
                    ownerProfileId: 'usera',
                });

                expect(result.ownerProfileId).toBe('usera');
            });

            it('throws error for non-existent connection', async () => {
                await expect(
                    userA.clients.fullAuth.edlink.setOwner({
                        connectionId: 'non-existent',
                        ownerProfileId: 'usera',
                    })
                ).rejects.toThrow('Connection not found');
            });
        });

        describe('toggleAutoIssue', () => {
            it('enables auto-issuance when owner is set', async () => {
                // First set the owner
                await userA.clients.fullAuth.edlink.setOwner({
                    connectionId: testConnectionId,
                    ownerProfileId: 'usera',
                });

                // Then enable auto-issuance
                const result = await userA.clients.fullAuth.edlink.toggleAutoIssue({
                    connectionId: testConnectionId,
                    enabled: true,
                });

                expect(result.autoIssueCredentials).toBe(true);
            });

            it('disables auto-issuance', async () => {
                // Set owner and enable first
                await userA.clients.fullAuth.edlink.setOwner({
                    connectionId: testConnectionId,
                    ownerProfileId: 'usera',
                });
                await userA.clients.fullAuth.edlink.toggleAutoIssue({
                    connectionId: testConnectionId,
                    enabled: true,
                });

                // Then disable
                const result = await userA.clients.fullAuth.edlink.toggleAutoIssue({
                    connectionId: testConnectionId,
                    enabled: false,
                });

                expect(result.autoIssueCredentials).toBe(false);
            });

            it('throws error for non-existent connection', async () => {
                await expect(
                    userA.clients.fullAuth.edlink.toggleAutoIssue({
                        connectionId: 'non-existent',
                        enabled: true,
                    })
                ).rejects.toThrow('Connection not found');
            });
        });

        describe('getIssuedCredentials', () => {
            it('returns empty records when no credentials issued', async () => {
                const result = await userA.clients.fullAuth.edlink.getIssuedCredentials({
                    connectionId: testConnectionId,
                });

                expect(result.records).toEqual([]);
                expect(result.count).toBe(0);
                expect(result.hasMore).toBe(false);
            });

            it('returns issued credentials with pagination info', async () => {
                // Create some issued credentials
                for (let i = 0; i < 5; i++) {
                    const completion = makeTestCompletion();
                    await createEdlinkIssuedCredential({
                        connectionId: testConnectionId,
                        submissionId: completion.submissionId,
                        assignmentId: completion.assignmentId,
                        studentEmail: completion.personEmail!,
                        studentName: `Student ${i + 1}`,
                        className: completion.className,
                        assignmentTitle: completion.assignmentTitle,
                        issuedAt: new Date().toISOString(),
                        status: 'ISSUED',
                    });
                }

                // Get first page
                const page1 = await userA.clients.fullAuth.edlink.getIssuedCredentials({
                    connectionId: testConnectionId,
                    limit: 2,
                    offset: 0,
                });

                expect(page1.records.length).toBe(2);
                expect(page1.count).toBe(5);
                expect(page1.hasMore).toBe(true);

                // Get second page
                const page2 = await userA.clients.fullAuth.edlink.getIssuedCredentials({
                    connectionId: testConnectionId,
                    limit: 2,
                    offset: 2,
                });

                expect(page2.records.length).toBe(2);
                expect(page2.hasMore).toBe(true);

                // Get last page
                const page3 = await userA.clients.fullAuth.edlink.getIssuedCredentials({
                    connectionId: testConnectionId,
                    limit: 2,
                    offset: 4,
                });

                expect(page3.records.length).toBe(1);
                expect(page3.hasMore).toBe(false);
            });

            it('returns records with correct structure', async () => {
                const completion = makeTestCompletion();
                await createEdlinkIssuedCredential({
                    connectionId: testConnectionId,
                    submissionId: completion.submissionId,
                    assignmentId: completion.assignmentId,
                    studentEmail: completion.personEmail!,
                    studentName: completion.personName,
                    className: completion.className,
                    assignmentTitle: completion.assignmentTitle,
                    grade: 95,
                    issuedAt: new Date().toISOString(),
                    status: 'ISSUED',
                });

                const result = await userA.clients.fullAuth.edlink.getIssuedCredentials({
                    connectionId: testConnectionId,
                });

                expect(result.records.length).toBe(1);
                const record = result.records[0];
                expect(record).toMatchObject({
                    submissionId: completion.submissionId,
                    assignmentId: completion.assignmentId,
                    studentEmail: completion.personEmail,
                    studentName: completion.personName,
                    className: completion.className,
                    assignmentTitle: completion.assignmentTitle,
                    grade: 95,
                    status: 'ISSUED',
                });
            });
        });
    });

    // ==========================================================================
    // Polling Service: Credential Issuance
    // ==========================================================================
    describe('Polling Service: Credential issuance for completions', () => {
        let testConnectionId: string;

        /**
         * Sets up passive stubs that prevent real external calls and control inputs.
         * Returns the action function (processEdlinkCompletions) — no mock refs are leaked.
         */
        const setupPollingStubs = async (options: {
            completions: EdlinkAssignmentCompletion[];
            issueCredentialImpl?: (...args: any[]) => any;
        }) => {
            vi.resetModules();

            const edlinkHelpers = await import('@helpers/edlink.helpers');
            const inboxHelpers = await import('@helpers/inbox.helpers');
            const learnCardHelpers = await import('@helpers/learnCard.helpers');

            vi.spyOn(edlinkHelpers, 'getEdlinkCompletions').mockResolvedValue({
                summary: {
                    classes: 1,
                    assignmentCompletions: options.completions.length,
                    courseCompletions: 0,
                },
                courseCompletions: [],
                assignmentCompletions: options.completions,
            });

            vi.spyOn(inboxHelpers, 'issueToInbox').mockResolvedValue({
                status: 'ISSUED',
                inboxCredential: { id: 'inbox-cred-123' },
                claimUrl: 'https://test.example.com/claim/123',
            } as any);

            vi.spyOn(learnCardHelpers, 'getLearnCard').mockResolvedValue({
                id: { did: () => 'did:key:test123' },
                invoke: {
                    issueCredential:
                        options.issueCredentialImpl ??
                        vi.fn().mockResolvedValue({ proof: { type: 'test' } }),
                },
            } as any);

            const { processEdlinkCompletions, resetIssuerLearnCard } = await import(
                '@services/edlink-polling.service'
            );
            resetIssuerLearnCard();

            return { processEdlinkCompletions };
        };

        beforeEach(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });

            const connData = makeTestConnection({ autoIssueCredentials: true });
            testConnectionId = connData.id;
            await createEdlinkConnection(connData);
        });

        afterAll(async () => {
            await EdlinkIssuedCredential.delete({ detach: true, where: {} });
            await EdlinkConnection.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
            vi.restoreAllMocks();
        });

        it('records an ISSUED credential with correct student data when a new completion arrives', async () => {
            // Given: a single new completion
            const testCompletion = makeTestCompletion({
                personEmail: 'student@university.edu',
                personName: 'Alice Johnson',
                assignmentTitle: 'Midterm Exam',
                className: 'Computer Science 101',
                grade: 92,
            });

            // When: polling runs
            const { processEdlinkCompletions } = await setupPollingStubs({
                completions: [testCompletion],
            });
            await processEdlinkCompletions();

            // Then: one ISSUED record with all fields populated
            const records = await getIssuedCredentialsForConnection(testConnectionId);
            expect(records).toHaveLength(1);
            expect(records[0]?.dataValues).toMatchObject({
                submissionId: testCompletion.submissionId,
                assignmentId: testCompletion.assignmentId,
                studentEmail: 'student@university.edu',
                studentName: 'Alice Johnson',
                className: 'Computer Science 101',
                assignmentTitle: 'Midterm Exam',
                grade: 92,
                status: 'ISSUED',
            });

            // Then: connection's lastPolledAt is updated
            const connection = await getEdlinkConnectionById(testConnectionId);
            expect(connection?.dataValues.lastPolledAt).toBeDefined();
        });

        it('does not create a new record when the submission was already issued', async () => {
            // Given: a completion that was already issued
            const testCompletion = makeTestCompletion();
            await createEdlinkIssuedCredential({
                connectionId: testConnectionId,
                submissionId: testCompletion.submissionId,
                assignmentId: testCompletion.assignmentId,
                studentEmail: testCompletion.personEmail!,
                studentName: testCompletion.personName,
                className: testCompletion.className,
                assignmentTitle: testCompletion.assignmentTitle,
                issuedAt: new Date().toISOString(),
                status: 'ISSUED',
            });

            // When: polling encounters the same submission again
            const { processEdlinkCompletions } = await setupPollingStubs({
                completions: [testCompletion],
            });
            await processEdlinkCompletions();

            // Then: still only one record (no duplicate)
            const records = await getIssuedCredentialsForConnection(testConnectionId);
            expect(records).toHaveLength(1);

            // Then: connection's lastPolledAt is updated
            const connection = await getEdlinkConnectionById(testConnectionId);
            expect(connection?.dataValues.lastPolledAt).toBeDefined();
        });

        it('records a SKIPPED credential with error when the student has no email', async () => {
            // Given: a completion with no student email
            const testCompletion = makeTestCompletion({ personEmail: null });

            // When: polling runs
            const { processEdlinkCompletions } = await setupPollingStubs({
                completions: [testCompletion],
            });
            await processEdlinkCompletions();

            // Then: one SKIPPED record with error message
            const records = await getIssuedCredentialsForConnection(testConnectionId);
            expect(records).toHaveLength(1);
            expect(records[0]?.dataValues).toMatchObject({
                submissionId: testCompletion.submissionId,
                assignmentId: testCompletion.assignmentId,
                studentName: testCompletion.personName,
                className: testCompletion.className,
                assignmentTitle: testCompletion.assignmentTitle,
                grade: testCompletion.grade,
                status: 'SKIPPED',
            });
            expect(records[0]?.dataValues.errorMessage).toContain('No email');

            // Then: connection's lastPolledAt is updated
            const connection = await getEdlinkConnectionById(testConnectionId);
            expect(connection?.dataValues.lastPolledAt).toBeDefined();
        });

        it('records a FAILED credential with error message when signing throws', async () => {
            // Given: a completion where signing will fail
            const testCompletion = makeTestCompletion();

            // When: polling runs with a broken signer
            const { processEdlinkCompletions } = await setupPollingStubs({
                completions: [testCompletion],
                issueCredentialImpl: vi.fn().mockRejectedValue(new Error('Signing failed')),
            });
            await processEdlinkCompletions();

            // Then: one FAILED record with the error message
            const records = await getIssuedCredentialsForConnection(testConnectionId);
            expect(records).toHaveLength(1);
            expect(records[0]?.dataValues).toMatchObject({
                submissionId: testCompletion.submissionId,
                assignmentId: testCompletion.assignmentId,
                studentEmail: testCompletion.personEmail,
                studentName: testCompletion.personName,
                className: testCompletion.className,
                assignmentTitle: testCompletion.assignmentTitle,
                grade: testCompletion.grade,
                status: 'FAILED',
                errorMessage: 'Signing failed',
            });

            // Then: connection's lastPolledAt is updated
            const connection = await getEdlinkConnectionById(testConnectionId);
            expect(connection?.dataValues.lastPolledAt).toBeDefined();
        });

        it('issues separate credential records for each completion in a single poll', async () => {
            // Given: two completions from different students/assignments
            const completionA = makeTestCompletion({
                personEmail: 'alice@university.edu',
                personName: 'Alice',
                assignmentTitle: 'Essay 1',
                className: 'English 101',
                grade: 88,
            });
            const completionB = makeTestCompletion({
                personEmail: 'bob@university.edu',
                personName: 'Bob',
                assignmentTitle: 'Lab Report',
                className: 'Chemistry 201',
                grade: 75,
            });

            // When: polling runs with both completions
            const { processEdlinkCompletions } = await setupPollingStubs({
                completions: [completionA, completionB],
            });
            await processEdlinkCompletions();

            // Then: two separate ISSUED records
            const records = await getIssuedCredentialsForConnection(testConnectionId);
            expect(records).toHaveLength(2);

            const alice = records.find(
                r => r.dataValues.studentEmail === 'alice@university.edu'
            );
            const bob = records.find(
                r => r.dataValues.studentEmail === 'bob@university.edu'
            );

            expect(alice?.dataValues).toMatchObject({
                submissionId: completionA.submissionId,
                studentName: 'Alice',
                assignmentTitle: 'Essay 1',
                className: 'English 101',
                grade: 88,
                status: 'ISSUED',
            });

            expect(bob?.dataValues).toMatchObject({
                submissionId: completionB.submissionId,
                studentName: 'Bob',
                assignmentTitle: 'Lab Report',
                className: 'Chemistry 201',
                grade: 75,
                status: 'ISSUED',
            });

            // Then: connection's lastPolledAt is updated
            const connection = await getEdlinkConnectionById(testConnectionId);
            expect(connection?.dataValues.lastPolledAt).toBeDefined();
        });
    });
});
