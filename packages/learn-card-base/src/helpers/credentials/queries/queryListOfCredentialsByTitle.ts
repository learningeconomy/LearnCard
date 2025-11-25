import { VC } from '@learncard/types';
import { getCredentialName } from '../../credentialHelpers';

/**
 * Compares a credential's title against a search title
 * @param vc - The credential to compare
 * @param searchTitle - The title to search for
 * @returns true if the vc's title matches the search title
 *
 * This function performs a case-insensitive partial match on the credential's title.
 * It will match if the search title is contained anywhere in the credential's name.
 */
const _vcTitleComparator = (vc: VC, searchTitle: string): boolean => {
    if (!vc || !searchTitle) return false;

    // Handle boost credentials
    let credentialToCheck = vc;
    if (vc?.boostCredential) {
        credentialToCheck = vc.boostCredential;
    }

    // Get the credential name using the helper
    const credentialName = getCredentialName(credentialToCheck);
    
    if (!credentialName) return false;

    // Perform case-insensitive partial match
    return credentialName.toLowerCase().includes(searchTitle.toLowerCase());
};

/**
 * Queries a list of credentials by title
 * @param credentialsList - The list of credentials to search
 * @param credentialQuery - Query object with structure: { reason: string; title: string }
 * @returns Array of credentials that match the title query
 *
 * Example usage:
 * ```
 * const query = {
 *   reason: "We need to verify your teamwork skills",
 *   title: "Teamwork"
 * };
 * const matches = queryListOfCredentialsByTitle(credentials, query);
 * ```
 */
export const queryListOfCredentialsByTitle = (
    credentialsList: VC[],
    credentialQuery: { reason?: string; title: string }
): VC[] => {
    const searchTitle = credentialQuery?.title;
    if (!searchTitle) return [];

    const matches: VC[] = [];
    for (let i = 0; i < credentialsList.length; i++) {
        const vc = credentialsList[i];
        if (_vcTitleComparator(vc, searchTitle)) {
            matches.push(vc);
        }
    }

    return matches;
};
