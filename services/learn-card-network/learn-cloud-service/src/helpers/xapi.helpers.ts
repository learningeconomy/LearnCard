import { AUTHOR_EXTENSION, XAPI_ENDPOINT } from '../constants/xapi';
import { areDidsEqual } from '@helpers/did.helpers';

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
        (await areDidsEqual(did, statement?.context?.extensions?.[AUTHOR_EXTENSION] ?? ''))
    );
};
