import { describe, test, expect } from 'vitest';

import XAPI, { type Statement, type Agent } from '@xapi/xapi';

import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { normalContract, normalFullTerms } from './helpers/contract.helpers';

const XAPI_CONTRACT_URI_EXTENSION = 'https://learncard.com/xapi/extensions/contractUri';

const endpoint = 'http://localhost:4100/xapi';

let a: LearnCard;
let b: LearnCard;

describe('XAPI Wrapper', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    describe('Basic Permissions', () => {
        test('User can Write Statements about themselves', async () => {
            const actor: Agent = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                name: 'User A',
            };

            const statement: Statement = {
                actor,
                verb: XAPI.Verbs.COMPLETED,
                object: {
                    id: 'http://example.org/activity/activity-1',
                    definition: {
                        name: { 'en-US': 'Activity 1' },
                        type: 'http://example.org/activity-type/generic-activity',
                    },
                },
            };

            const result = await fetch(`${endpoint}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await a.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
                body: JSON.stringify(statement),
            });

            expect(result.status).toEqual(200);
        });

        test('User can Read Statements about themselves', async () => {
            const actor: Agent = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                name: 'User A',
            };

            const params = new URLSearchParams({ agent: JSON.stringify(actor) });

            const result = await fetch(`${endpoint}/statements?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await a.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
            });

            expect(result.status).toEqual(200);
        });

        test('User can Void Statements about themselves', async () => {
            const actor: Agent = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                name: 'User A',
            };

            const statement: Statement = {
                actor,
                verb: XAPI.Verbs.COMPLETED,
                object: {
                    id: 'http://example.org/activity/activity-1',
                    definition: {
                        name: { 'en-US': 'Activity 1' },
                        type: 'http://example.org/activity-type/generic-activity',
                    },
                },
            };

            const result = await fetch(`${endpoint}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await a.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
                body: JSON.stringify(statement),
            });

            expect(result.status).toEqual(200);

            const statementId: string = (await result.json())[0];

            const voidStatement: Statement = {
                actor,
                verb: XAPI.Verbs.VOIDED,
                object: { objectType: 'StatementRef', id: statementId },
            };

            const result2 = await fetch(`${endpoint}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await a.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
                body: JSON.stringify(voidStatement),
            });

            expect(result2.status).toEqual(200);
        });

        test('User cannot Write Statements about others', async () => {
            const actor: Agent = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                name: 'User A',
            };

            const statement: Statement = {
                actor,
                verb: XAPI.Verbs.COMPLETED,
                object: {
                    id: 'http://example.org/activity/activity-1',
                    definition: {
                        name: { 'en-US': 'Activity 1' },
                        type: 'http://example.org/activity-type/generic-activity',
                    },
                },
            };

            const result = await fetch(`${endpoint}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await b.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
                body: JSON.stringify(statement),
            });

            expect(result.status).toEqual(401);
        });

        test('User cannot Read Statements about others', async () => {
            const actor: Agent = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                name: 'User A',
            };

            const params = new URLSearchParams({ agent: JSON.stringify(actor) });

            const result = await fetch(`${endpoint}/statements?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await b.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
            });

            expect(result.status).toEqual(401);
        });

        test('User can not Void Statements about others', async () => {
            const actor: Agent = {
                account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                name: 'User A',
            };

            const statement: Statement = {
                actor,
                verb: XAPI.Verbs.COMPLETED,
                object: {
                    id: 'http://example.org/activity/activity-1',
                    definition: {
                        name: { 'en-US': 'Activity 1' },
                        type: 'http://example.org/activity-type/generic-activity',
                    },
                },
            };

            const result = await fetch(`${endpoint}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await a.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
                body: JSON.stringify(statement),
            });

            expect(result.status).toEqual(200);

            const statementId: string = (await result.json())[0];

            const voidStatement: Statement = {
                actor,
                verb: XAPI.Verbs.VOIDED,
                object: { objectType: 'StatementRef', id: statementId },
            };

            const result2 = await fetch(`${endpoint}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await b.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
                body: JSON.stringify(voidStatement),
            });

            expect(result2.status).toEqual(401);

            const voidStatement2: Statement = {
                actor: {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: b.id.did() },
                    name: 'User B',
                },
                verb: XAPI.Verbs.VOIDED,
                object: { objectType: 'StatementRef', id: statementId },
            };

            const result3 = await fetch(`${endpoint}/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': (await b.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string,
                },
                body: JSON.stringify(voidStatement2),
            });

            expect(result3.status).toEqual(401);
        });
    });

    describe('Delegation', () => {
        describe('Valid Delegate Credentials', () => {
            test('Read-only', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['read'],
                });
                const delegateCredential = await a.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const params = new URLSearchParams({ agent: JSON.stringify(actor) });

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);

                const result = await fetch(`${endpoint}/statements?${params}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                });

                expect(result.status).toEqual(200);
            });

            test('Write-only', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['write'],
                });
                const delegateCredential = await a.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const statement: Statement = {
                    actor,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/activity-1',
                        definition: {
                            name: { 'en-US': 'Activity 1' },
                            type: 'http://example.org/activity-type/generic-activity',
                        },
                    },
                };

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);

                const result = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                    body: JSON.stringify(statement),
                });

                expect(result.status).toEqual(200);
            });

            test('Write permissions can Void their own statements', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['write'],
                });
                const delegateCredential = await a.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const statement: Statement = {
                    actor,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/activity-1',
                        definition: {
                            name: { 'en-US': 'Activity 1' },
                            type: 'http://example.org/activity-type/generic-activity',
                        },
                    },
                };

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);
                const vp = (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                    proofPurpose: 'authentication',
                    proofFormat: 'jwt',
                })) as any as string;

                const result = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vp,
                    },
                    body: JSON.stringify(statement),
                });

                expect(result.status).toEqual(200);

                const statementId: string = (await result.json())[0];

                const voidStatement: Statement = {
                    actor,
                    verb: XAPI.Verbs.VOIDED,
                    object: { objectType: 'StatementRef', id: statementId },
                };

                const result2 = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vp,
                    },
                    body: JSON.stringify(voidStatement),
                });

                expect(result2.status).toEqual(200);
            });

            test('Read/write reading', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['read', 'write'],
                });
                const delegateCredential = await a.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const params = new URLSearchParams({ agent: JSON.stringify(actor) });

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);

                const result = await fetch(`${endpoint}/statements?${params}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                });

                expect(result.status).toEqual(200);
            });

            test('Read/write writing', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['write', 'read'],
                });
                const delegateCredential = await a.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const statement: Statement = {
                    actor,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/activity-1',
                        definition: {
                            name: { 'en-US': 'Activity 1' },
                            type: 'http://example.org/activity-type/generic-activity',
                        },
                    },
                };

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);

                const result = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                    body: JSON.stringify(statement),
                });

                expect(result.status).toEqual(200);
            });
        });

        describe('Invalid Delegate Credentials', () => {
            test('Unsigned VC', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['read'],
                });

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const params = new URLSearchParams({ agent: JSON.stringify(actor) });

                const unsignedDidAuthVp = await b.invoke.newPresentation(
                    unsignedDelegateCredential as any
                );

                const result = await fetch(`${endpoint}/statements?${params}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                });

                expect(result.status).toEqual(401);
            });

            test('Self-Issued used for someone else', async () => {
                const unsignedDelegateCredential = b.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['read'],
                });
                const delegateCredential = await b.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const params = new URLSearchParams({ agent: JSON.stringify(actor) });

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);

                const result = await fetch(`${endpoint}/statements?${params}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                });

                expect(result.status).toEqual(401);
            });

            test('Read-only delegate trying to write', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['read'],
                });
                const delegateCredential = await a.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const statement: Statement = {
                    actor,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/activity-1',
                        definition: {
                            name: { 'en-US': 'Activity 1' },
                            type: 'http://example.org/activity-type/generic-activity',
                        },
                    },
                };

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);

                const result = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                    body: JSON.stringify(statement),
                });

                expect(result.status).toEqual(401);
            });

            test('Write-only delegate trying to read', async () => {
                const unsignedDelegateCredential = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['write'],
                });
                const delegateCredential = await a.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const params = new URLSearchParams({ agent: JSON.stringify(actor) });

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential);

                const result = await fetch(`${endpoint}/statements?${params}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                            proofPurpose: 'authentication',
                            proofFormat: 'jwt',
                        })) as any as string,
                    },
                });

                expect(result.status).toEqual(401);
            });

            test("Write permissions can not Void statements they didn't make", async () => {
                const c = await getLearnCardForUser('c');

                const unsignedDelegateCredential1 = a.invoke.newCredential({
                    type: 'delegate',
                    subject: b.id.did(),
                    access: ['write'],
                });
                const delegateCredential1 = await a.invoke.issueCredential(
                    unsignedDelegateCredential1
                );

                const unsignedDelegateCredential2 = a.invoke.newCredential({
                    type: 'delegate',
                    subject: c.id.did(),
                    access: ['write'],
                });
                const delegateCredential2 = await a.invoke.issueCredential(
                    unsignedDelegateCredential2
                );

                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const statement: Statement = {
                    actor,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/activity-1',
                        definition: {
                            name: { 'en-US': 'Activity 1' },
                            type: 'http://example.org/activity-type/generic-activity',
                        },
                    },
                };

                const unsignedDidAuthVp = await b.invoke.newPresentation(delegateCredential1);
                const vp = (await b.invoke.issuePresentation(unsignedDidAuthVp, {
                    proofPurpose: 'authentication',
                    proofFormat: 'jwt',
                })) as any as string;

                const result = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vp,
                    },
                    body: JSON.stringify(statement),
                });

                expect(result.status).toEqual(200);

                const statementId: string = (await result.json())[0];

                const voidStatement: Statement = {
                    actor,
                    verb: XAPI.Verbs.VOIDED,
                    object: { objectType: 'StatementRef', id: statementId },
                };

                const unsignedDidAuthVp2 = await c.invoke.newPresentation(delegateCredential2);
                const vp2 = (await c.invoke.issuePresentation(unsignedDidAuthVp2, {
                    proofPurpose: 'authentication',
                    proofFormat: 'jwt',
                })) as any as string;

                const result2 = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vp2,
                    },
                    body: JSON.stringify(voidStatement),
                });

                expect(result2.status).toEqual(401);
            });
        });
    });

    describe('Contract-Scoped Statements', () => {
        /**
         * Creates a DID-Auth VP JWT with a delegate credential and optional contractUri.
         * The contractUri is embedded in the VP object before signing, so it becomes
         * part of the signed JWT that DIDKit can verify.
         */
        const createVpWithDelegateCredential = async (
            learnCard: LearnCard,
            delegateCredential: any,
            contractUri?: string
        ): Promise<string> => {
            const unsignedVp: any = await learnCard.invoke.newPresentation(delegateCredential);

            // Add contractUri to the VP before signing - it will be included in the signed JWT
            if (contractUri) unsignedVp.contractUri = contractUri;

            console.log('unsignedVp:', JSON.stringify(unsignedVp));

            return (await learnCard.invoke.issuePresentation(unsignedVp, {
                proofPurpose: 'authentication',
                proofFormat: 'jwt',
            })) as unknown as string;
        };

        /**
         * Helper to query xAPI statements for an actor and filter by contract URI extension.
         */
        const queryStatementsByContract = async (
            actor: Agent,
            auth: string,
            contractUri: string
        ): Promise<Statement[]> => {
            const params = new URLSearchParams({ agent: JSON.stringify(actor) });

            const response = await fetch(`${endpoint}/statements?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Experience-API-Version': '1.0.3',
                    'X-VP': auth,
                },
            });

            if (response.status !== 200) return [];

            const result = await response.json();
            const statements: Statement[] = result.statements || [];

            // Filter by contract URI extension
            return statements.filter(
                (stmt: any) =>
                    stmt.context?.extensions?.[XAPI_CONTRACT_URI_EXTENSION] === contractUri
            );
        };

        describe('Consenter querying statements made about them through contracts', () => {
            test('User A consents to contracts X and Y, owners B and C make statements, A can query by contract', async () => {
                const c = await getLearnCardForUser('c');

                // Create contract X owned by B
                const contractXUri = await b.invoke.createContract({
                    contract: normalContract,
                    name: 'Contract X for xAPI Test',
                    writers: [USERS.b.profileId],
                });

                // Create contract Y owned by C
                const contractYUri = await c.invoke.createContract({
                    contract: normalContract,
                    name: 'Contract Y for xAPI Test',
                    writers: [USERS.c.profileId],
                });

                // User A consents to contract X
                await a.invoke.consentToContract(contractXUri, { terms: normalFullTerms });

                // User A consents to contract Y
                await a.invoke.consentToContract(contractYUri, { terms: normalFullTerms });

                // User A issues delegate credentials to B and C for writing statements
                const delegateCredentialB = await a.invoke.issueCredential(
                    a.invoke.newCredential({
                        type: 'delegate',
                        subject: b.id.did(),
                        access: ['write'],
                    })
                );

                const delegateCredentialC = await a.invoke.issueCredential(
                    a.invoke.newCredential({
                        type: 'delegate',
                        subject: c.id.did(),
                        access: ['write'],
                    })
                );

                const actorA: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                // B makes a statement about A through contract X
                const statementFromB: Statement = {
                    actor: actorA,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/contract-x-activity-1',
                        definition: {
                            name: { 'en-US': 'Activity from Contract X' },
                            type: 'http://example.org/activity-type/contract-activity',
                        },
                    },
                };

                const vpB = await createVpWithDelegateCredential(
                    b,
                    delegateCredentialB,
                    contractXUri
                );

                const resultB = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vpB,
                    },
                    body: JSON.stringify(statementFromB),
                });

                expect(resultB.status).toEqual(200);

                // C makes a statement about A through contract Y
                const statementFromC: Statement = {
                    actor: actorA,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/contract-y-activity-1',
                        definition: {
                            name: { 'en-US': 'Activity from Contract Y' },
                            type: 'http://example.org/activity-type/contract-activity',
                        },
                    },
                };

                const vpC = await createVpWithDelegateCredential(
                    c,
                    delegateCredentialC,
                    contractYUri
                );

                const resultC = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vpC,
                    },
                    body: JSON.stringify(statementFromC),
                });

                expect(resultC.status).toEqual(200);

                // User A queries and filters by contract X - should see only B's statement
                const authA = (await a.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string;
                const statementsForContractX = await queryStatementsByContract(
                    actorA,
                    authA,
                    contractXUri
                );

                expect(statementsForContractX.length).toBeGreaterThanOrEqual(1);
                expect(
                    statementsForContractX.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-x-activity-1'
                    )
                ).toBe(true);
                expect(
                    statementsForContractX.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-y-activity-1'
                    )
                ).toBe(false);

                // User A queries and filters by contract Y - should see only C's statement
                const statementsForContractY = await queryStatementsByContract(
                    actorA,
                    authA,
                    contractYUri
                );

                expect(statementsForContractY.length).toBeGreaterThanOrEqual(1);
                expect(
                    statementsForContractY.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-y-activity-1'
                    )
                ).toBe(true);
                expect(
                    statementsForContractY.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-x-activity-1'
                    )
                ).toBe(false);
            });
        });

        describe('Contract owner querying statements they made through their contract', () => {
            test('User A owns contract, B and C consent, A makes statements about both, queries are scoped to contract', async () => {
                const c = await getLearnCardForUser('c');

                // Create contract X owned by A
                const contractXUri = await a.invoke.createContract({
                    contract: normalContract,
                    name: 'Contract X Owned by A',
                    writers: [USERS.a.profileId],
                });

                // Create contract Y owned by A (for scoping verification)
                const contractYUri = await a.invoke.createContract({
                    contract: normalContract,
                    name: 'Contract Y Owned by A',
                    writers: [USERS.a.profileId],
                });

                // B and C consent to contract X
                await b.invoke.consentToContract(contractXUri, { terms: normalFullTerms });
                await c.invoke.consentToContract(contractXUri, { terms: normalFullTerms });

                // B also consents to contract Y (for scoping test)
                await b.invoke.consentToContract(contractYUri, { terms: normalFullTerms });

                // B and C issue delegate credentials to A
                const delegateFromB = await b.invoke.issueCredential(
                    b.invoke.newCredential({
                        type: 'delegate',
                        subject: a.id.did(),
                        access: ['write'],
                    })
                );

                const delegateFromC = await c.invoke.issueCredential(
                    c.invoke.newCredential({
                        type: 'delegate',
                        subject: a.id.did(),
                        access: ['write'],
                    })
                );

                const actorB: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: b.id.did() },
                    name: 'User B',
                };

                const actorC: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: c.id.did() },
                    name: 'User C',
                };

                // A makes statement about B through contract X
                const statementAboutB_X: Statement = {
                    actor: actorB,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/contract-x-user-b',
                        definition: {
                            name: { 'en-US': 'User B Activity via Contract X' },
                            type: 'http://example.org/activity-type/contract-activity',
                        },
                    },
                };

                const vpForB_X = await createVpWithDelegateCredential(
                    a,
                    delegateFromB,
                    contractXUri
                );

                const resultB_X = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vpForB_X,
                    },
                    body: JSON.stringify(statementAboutB_X),
                });

                expect(resultB_X.status).toEqual(200);

                // A makes statement about C through contract X
                const statementAboutC_X: Statement = {
                    actor: actorC,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/contract-x-user-c',
                        definition: {
                            name: { 'en-US': 'User C Activity via Contract X' },
                            type: 'http://example.org/activity-type/contract-activity',
                        },
                    },
                };

                const vpForC_X = await createVpWithDelegateCredential(
                    a,
                    delegateFromC,
                    contractXUri
                );

                const resultC_X = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vpForC_X,
                    },
                    body: JSON.stringify(statementAboutC_X),
                });

                expect(resultC_X.status).toEqual(200);

                // A makes statement about B through contract Y (for scoping verification)
                const statementAboutB_Y: Statement = {
                    actor: actorB,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/contract-y-user-b',
                        definition: {
                            name: { 'en-US': 'User B Activity via Contract Y' },
                            type: 'http://example.org/activity-type/contract-activity',
                        },
                    },
                };

                const vpForB_Y = await createVpWithDelegateCredential(
                    a,
                    delegateFromB,
                    contractYUri
                );

                const resultB_Y = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vpForB_Y,
                    },
                    body: JSON.stringify(statementAboutB_Y),
                });

                expect(resultB_Y.status).toEqual(200);

                // A queries B's statements and filters by contract X - should see only contract X statement
                const authB = (await b.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string;
                const statementsForB_ContractX = await queryStatementsByContract(
                    actorB,
                    authB,
                    contractXUri
                );

                expect(statementsForB_ContractX.length).toBeGreaterThanOrEqual(1);
                expect(
                    statementsForB_ContractX.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-x-user-b'
                    )
                ).toBe(true);
                expect(
                    statementsForB_ContractX.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-y-user-b'
                    )
                ).toBe(false);

                // A queries B's statements and filters by contract Y - should see only contract Y statement
                const statementsForB_ContractY = await queryStatementsByContract(
                    actorB,
                    authB,
                    contractYUri
                );

                expect(statementsForB_ContractY.length).toBeGreaterThanOrEqual(1);
                expect(
                    statementsForB_ContractY.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-y-user-b'
                    )
                ).toBe(true);
                expect(
                    statementsForB_ContractY.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-x-user-b'
                    )
                ).toBe(false);

                // Query C's statements filtered by contract X - should see C's statement
                const authC = (await c.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string;
                const statementsForC_ContractX = await queryStatementsByContract(
                    actorC,
                    authC,
                    contractXUri
                );

                expect(statementsForC_ContractX.length).toBeGreaterThanOrEqual(1);
                expect(
                    statementsForC_ContractX.some(
                        s =>
                            s.object &&
                            'id' in s.object &&
                            s.object.id === 'http://example.org/activity/contract-x-user-c'
                    )
                ).toBe(true);
            });
        });

        describe('Statement without contractUri has no extension', () => {
            test('Statements made without contractUri in JWT should not have the extension', async () => {
                const actor: Agent = {
                    account: { homePage: 'https://www.w3.org/TR/did-core/', name: a.id.did() },
                    name: 'User A',
                };

                const statement: Statement = {
                    actor,
                    verb: XAPI.Verbs.COMPLETED,
                    object: {
                        id: 'http://example.org/activity/no-contract-activity',
                        definition: {
                            name: { 'en-US': 'Activity Without Contract' },
                            type: 'http://example.org/activity-type/generic-activity',
                        },
                    },
                };

                // Use regular VP without contractUri
                const vp = (await a.invoke.getDidAuthVp({ proofFormat: 'jwt' })) as string;

                const result = await fetch(`${endpoint}/statements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vp,
                    },
                    body: JSON.stringify(statement),
                });

                expect(result.status).toEqual(200);

                // Query statements and verify the new one doesn't have the contract extension
                const params = new URLSearchParams({ agent: JSON.stringify(actor) });

                const queryResult = await fetch(`${endpoint}/statements?${params}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Experience-API-Version': '1.0.3',
                        'X-VP': vp,
                    },
                });

                expect(queryResult.status).toEqual(200);

                const data = await queryResult.json();
                const statements: Statement[] = data.statements || [];

                const ourStatement = statements.find(
                    (s: any) => s.object?.id === 'http://example.org/activity/no-contract-activity'
                );

                expect(ourStatement).toBeDefined();

                // Should NOT have the contract URI extension
                expect(
                    (ourStatement as any)?.context?.extensions?.[XAPI_CONTRACT_URI_EXTENSION]
                ).toBeUndefined();
            });
        });
    });
});
