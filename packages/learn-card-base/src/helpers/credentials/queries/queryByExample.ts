import { VC } from '@learncard/types';
import { getCredentialName } from '../../credentialHelpers';
import _ from 'lodash';

/**
 *
 * @param vc is the credential to compare
 * @param example is the example credential to compare against
 * @returns true if the vc matches the example
 *
 * This function is used to compare a credential against an example credential.
 * It current compares based on the following:
 * - @context
 * - type
 * - credentialSubject.achievement.id
 *  - This is only used for OpenBadgeCredentials
 *
 * The heuristic used for comparing is fuzzy - it only requires that the credential have a sufficient number of matching @context and type values.
 * It is likely that, over time, as the VC ecosystem evolves, we will have a more robust way of comparing credentials.
 *
 */
const _vcExampleComparator = (vc: VC, example: VC): boolean => {
    if (!vc || !example) return false;
    if (vc?.boostCredential) {
        vc = vc.boostCredential;
    }

    const contextTypeAlignment =
        _.intersection(vc['@context'], example['@context']).length >= 2 &&
        _.intersection(vc.type, example.type).length >= 1;

    if (
        contextTypeAlignment &&
        vc.type.includes('OpenBadgeCredential') &&
        example.type.includes('OpenBadgeCredential')
    ) {
        if (vc.credentialSubject?.achievement?.id && example.credentialSubject?.achievement?.id) {
            return _.isEqual(
                vc.credentialSubject?.achievement?.id,
                example.credentialSubject?.achievement?.id
            );
        } else {
            return false;
        }
    }

    return contextTypeAlignment;
};

export const queryListOfCredentialsByExample = (
    credentialsList: VC[],
    credentialQuery: any
): VC[] => {
    const exampleCredential = credentialQuery?.example;
    if (!exampleCredential) return [];

    let intersection: VC[] = [];
    for (let x = 0; x < credentialsList.length; x++) {
        const vc = credentialsList[x];
        if (_vcExampleComparator(vc, exampleCredential)) {
            intersection.push(vc);
        }
    }

    return intersection;
};
