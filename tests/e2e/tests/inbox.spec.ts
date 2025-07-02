import { describe, test, expect } from 'vitest';

import { getLearnCardForUser, LearnCard } from './helpers/learncard.helpers';

let a: LearnCard;
let token: string;

describe('Inbox', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        const grantId = await a.invoke.addAuthGrant({
            name: 'test',
            scope: 'inbox:write',
        });

        token = await a.invoke.getAPITokenForAuthGrant(grantId);
    });

    describe('Issue Credential', () => {
        test('should allow sending a credential using the HTTP route', async () => {
            // Prepare the payload for the HTTP request
            const payload = {
                credential: await a.invoke.issueCredential(await a.invoke.getTestVc()),
                recipient: { type: 'email', value: 'userB@test.com' },
            };

            // Send the boost using the HTTP route
            const response = await fetch(
                `http://localhost:4000/api/inbox/issue`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('DELIVERED'),
                recipient: expect.objectContaining({
                    type: 'email',
                    value: 'userB@test.com',
                }),
                claimUrl: expect.any(String),
            });
        });

        test('should allow sending a credential using the HTTP route with a signing authority', async () => {
            const sa = await a.invoke.createSigningAuthority('test-sa');
            if (!sa) {
                throw new Error('Failed to create signing authority');
            }
            const registered = await a.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
            if (!registered) {
                throw new Error('Failed to register signing authority');
            }

            // Prepare the payload for the HTTP request
            const payload = {
                credential: await a.invoke.issueCredential(await a.invoke.getTestVc()),
                recipient: { type: 'email', value: 'userB@test.com' },
                webhookUrl: 'https://example.com/webhook',
                signingAuthority: {
                    endpoint: sa.endpoint!,
                    name: sa.name,
                },
            };

            // Send the boost using the HTTP route
            const response = await fetch(
                `http://localhost:4000/api/inbox/issue`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('DELIVERED'),
                recipient: expect.objectContaining({
                    type: 'email',
                    value: 'userB@test.com',
                }),
                claimUrl: expect.any(String),
            });
        });
    });
});
