import type { VC } from '@learncard/types';

import { areDidsEqual } from '@helpers/did.helpers';
import { getEmptyLearnCard } from './learnCard.helpers';

export const verifyDelegateCredential = async (
    delegateCredential: VC,
    targetDid: string,
    isReadRequest: boolean
) => {
    const learnCard = await getEmptyLearnCard();

    const verification = await learnCard.invoke.verifyCredential(delegateCredential);

    if (
        verification.warnings.length > 0 ||
        verification.errors.length > 0 ||
        !verification.checks.includes('proof')
    ) {
        return false;
    }

    const delegateIssuer =
        typeof delegateCredential.issuer === 'string'
            ? delegateCredential.issuer
            : delegateCredential.issuer.id ?? '';

    if (!(await areDidsEqual(delegateIssuer, targetDid))) {
        return false;
    }

    const requiredPermission = isReadRequest ? 'read' : 'write';
    return delegateCredential.permissions?.statementAccess?.includes(requiredPermission);
};
