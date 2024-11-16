import { describe, test, expect } from 'vitest';

import XAPI, { type Statement, type Agent } from '@xapi/xapi';
import { NetworkLearnCardFromSeed } from '@learncard/init';
import type { UnsignedVC } from '@learncard/types';

import { getLearnCardForUser } from './helpers/learncard.helpers';

const endpoint = 'http://localhost:4100/xapi';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

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
        });
    });
});
