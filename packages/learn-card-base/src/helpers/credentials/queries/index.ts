import { VC } from '@learncard/types';
import { queryListOfCredentialsByTitle } from './queryListOfCredentialsByTitle';
import { queryListOfCredentialsByExample } from './queryByExample';

export enum QueryTypes {
    QueryByTitle = 'QueryByTitle',
    QueryByExample = 'QueryByExample',
}

export const queryListOfCredentials = (credentialsList: VC[], queries: any[]): VC[] => {
    let returnVcs: VC[] = [];

    queries.forEach(query => {
        if (query.type === QueryTypes.QueryByExample)
            returnVcs = [
                ...returnVcs,
                ...queryListOfCredentialsByExample(credentialsList, query.credentialQuery),
            ];
        else if (query.type === QueryTypes.QueryByTitle)
            returnVcs = [
                ...returnVcs,
                ...queryListOfCredentialsByTitle(credentialsList, query.credentialQuery),
            ];
    });

    return returnVcs;
};
