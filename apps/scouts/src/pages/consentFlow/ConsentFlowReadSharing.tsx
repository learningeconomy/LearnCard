import React from 'react';
import { Updater } from 'use-immer';
import { ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';
import { curriedStateSlice } from '@learncard/helpers';

import ConsentFlowReadSharingItem from './ConsentFlowReadSharingItem';
import ConsentFlowWriteSharingItem from './ConsentFlowWriteSharingItem';
import { getPersonalEntry } from '../../helpers/contract.helpers';
import { useCurrentUser } from 'learn-card-base';

type ConsentFlowReadSharingProps = {
    contract: ConsentFlowContract['read'];
    terms: ConsentFlowTerms['read'];
    setState: Updater<ConsentFlowTerms['read']>;
    contractOwnerDid: string;
};

const ConsentFlowReadSharing: React.FC<ConsentFlowReadSharingProps> = ({
    contract,
    terms,
    setState,
    contractOwnerDid,
}) => {
    const currentUser = useCurrentUser();
    const updateSlice = curriedStateSlice(setState);
    const updateCredentials = updateSlice('credentials');
    const updateCategories = curriedStateSlice(updateCredentials)('categories');
    const updateCategory = curriedStateSlice(updateCategories);
    const updatePersonal = curriedStateSlice(updateSlice('personal'));

    const credentialCategories = Object.entries(contract.credentials.categories).map(
        ([category, { required }]) => {
            const term = terms.credentials.categories[category] ?? {
                shareAll: false,
                shared: [], // boost uris
                sharing: false,
            };

            return (
                <ConsentFlowReadSharingItem
                    key={category}
                    term={term}
                    setTerm={updateCategory(category)}
                    category={category}
                    required={required}
                    contractOwnerDid={contractOwnerDid}
                />
            );
        }
    );

    const personalItems = Object.entries(contract.personal).map(([key, { required }]) => {
        const term = Boolean(terms.personal[key] ?? false);

        return (
            <ConsentFlowWriteSharingItem
                key={key}
                term={term}
                setTerm={newTerm =>
                    updatePersonal(key, newTerm ? getPersonalEntry(key, currentUser) : '')
                }
                category={key}
                required={required}
            />
        );
    });

    return (
        <ul className="bg-white rounded-[24px] w-full flex flex-col overflow-hidden">
            {credentialCategories}
            {personalItems}
        </ul>
    );
};

export default ConsentFlowReadSharing;
