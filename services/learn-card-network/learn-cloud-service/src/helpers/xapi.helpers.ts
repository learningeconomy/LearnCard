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

export const verifyVoidStatement = async (
    targetDid: string,
    did: string,
    statementId: string,
    auth: string
) => {
    const response = await fetch(
        new URL(`${XAPI_ENDPOINT}/statements?statementId=${statementId}`),
        { headers: { Authorization: auth, 'X-Experience-API-Version': '1.0.3' } }
    );

    if (response.status !== 200) return false;

    const statement = await response.json();

    return (
        (await areDidsEqual(targetDid, statement?.actor?.account?.name ?? '')) &&
        (await some(statement?.authority?.member ?? [], async member =>
            areDidsEqual(did, (member as any)?.account?.name ?? '')
        ))
    );
};
