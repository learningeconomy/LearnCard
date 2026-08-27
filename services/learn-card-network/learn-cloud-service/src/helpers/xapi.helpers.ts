import { some } from 'async';
import type { Statement } from '@xapi/xapi';

import { XAPI_ENDPOINT, XAPI_CONTRACT_URI_EXTENSION } from '../constants/xapi';
import { areDidsEqual } from '@helpers/did.helpers';

/** Injects a contract URI into an xAPI statement's context.extensions. */
export const injectContractUriIntoStatement = (
    statement: Statement,
    contractUri: string
): Statement => ({
    ...statement,
    context: {
        ...statement.context,
        extensions: {
            ...statement.context?.extensions,
            [XAPI_CONTRACT_URI_EXTENSION]: contractUri,
        },
    },
});

const getAccountName = (actor: unknown): string => {
    if (!actor || typeof actor !== 'object' || !('account' in actor)) return '';

    const { account } = actor;
    if (!account || typeof account !== 'object' || !('name' in account)) return '';

    return typeof account.name === 'string' ? account.name : '';
};

export const verifyVoidStatement = async (
    targetDid: string,
    did: string,
    statementId: string,
    auth: string
): Promise<boolean> => {
    const response = await fetch(
        new URL(`${XAPI_ENDPOINT}/statements?statementId=${statementId}`),
        { headers: { Authorization: auth, 'X-Experience-API-Version': '1.0.3' } }
    );

    if (response.status !== 200) return false;

    const statement: unknown = await response.json();
    if (!statement || typeof statement !== 'object') return false;

    const actorAccountName = getAccountName('actor' in statement ? statement.actor : undefined);
    const authority = 'authority' in statement ? statement.authority : undefined;
    const authorityMembers =
        authority &&
        typeof authority === 'object' &&
        (!('objectType' in authority) || authority.objectType === 'Group') &&
        'member' in authority &&
        Array.isArray(authority.member)
            ? authority.member
            : [];

    return (
        (await areDidsEqual(targetDid, actorAccountName)) &&
        (await some(authorityMembers, async member => areDidsEqual(did, getAccountName(member))))
    );
};
