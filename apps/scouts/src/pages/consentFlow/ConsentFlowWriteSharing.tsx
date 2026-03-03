import React from 'react';
import { Updater } from 'use-immer';
import { ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';
import { curriedStateSlice } from '@learncard/helpers';

import ConsentFlowWriteSharingItem from './ConsentFlowWriteSharingItem';

type ConsentFlowWriteSharingProps = {
    contract: ConsentFlowContract['write'];
    terms: ConsentFlowTerms['write'];
    setState: Updater<ConsentFlowTerms['write']>;
};

const ConsentFlowWriteSharing: React.FC<ConsentFlowWriteSharingProps> = ({
    contract,
    terms,
    setState,
}) => {
    const updateSlice = curriedStateSlice(setState);
    const updateCredentials = updateSlice('credentials');
    const updateCategories = curriedStateSlice(updateCredentials)('categories');
    const updateCategory = curriedStateSlice(updateCategories);
    const updatePersonal = curriedStateSlice(updateSlice('personal'));

    const credentialCategories = Object.entries(contract.credentials.categories).map(
        ([category, { required }]) => {
            const term = terms.credentials.categories[category] ?? false;

            return (
                <ConsentFlowWriteSharingItem
                    key={category}
                    term={term}
                    setTerm={updateCategory(category)}
                    category={category}
                    required={required}
                />
            );
        }
    );

    const personalItems = Object.entries(contract.personal).map(([key, { required }]) => {
        const term = terms.personal[key] ?? false;

        return (
            <ConsentFlowWriteSharingItem
                key={key}
                term={term}
                setTerm={updatePersonal(key)}
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

export default ConsentFlowWriteSharing;
