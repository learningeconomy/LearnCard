import { describe, test, expect } from 'vitest';

import XAPI, { type Statement, type Agent } from '@xapi/xapi';
import { NetworkLearnCardFromSeed } from '@learncard/init';

import { getLearnCardForUser } from './helpers/learncard.helpers';

const endpoint = 'http://localhost:4100/xapi';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

describe('XAPI Wrapper', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

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
