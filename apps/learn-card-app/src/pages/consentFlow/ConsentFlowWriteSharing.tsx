import React from 'react';
import { Updater } from 'use-immer';
import {
    ConsentFlowContract,
    ConsentFlowContractDetails,
    ConsentFlowTerms,
} from '@learncard/types';
import { curriedStateSlice } from '@learncard/helpers';

import { BrandingEnum } from 'learn-card-base';

import ConsentFlowWriteSharingItem from './ConsentFlowWriteSharingItem';
import ConsentFlowAiSessionsWriteItem from './ConsentFlowAiSessionsWriteItem';

import { sidemenuLinks } from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import {
    ALL_AI_CREDENTIAL_TYPES,
    AI_CREDENTIAL_TYPE,
    getInfoFromContractKey,
} from '../../helpers/contract.helpers';

type ConsentFlowWriteSharingProps = {
    contract: ConsentFlowContract['write'];
    terms: ConsentFlowTerms['write'];
    setState: Updater<ConsentFlowTerms['write']>;
    showCategories?: boolean;
    showPersonal?: boolean;
    contractDetails: ConsentFlowContractDetails;
    app: any;
};

const ConsentFlowWriteSharing: React.FC<ConsentFlowWriteSharingProps> = ({
    contract,
    terms,
    setState,
    contractDetails,
    showCategories = true,
    showPersonal = false, // default to false since this feature is non-functional + probably doesn't make sense
    app,
}) => {
    const updateSlice = curriedStateSlice(setState);
    const updateCredentials = updateSlice('credentials');
    const updateCategories = curriedStateSlice(updateCredentials)('categories');
    const updateCategory = curriedStateSlice(updateCategories);
    const updatePersonal = curriedStateSlice(updateSlice('personal'));

    const sidemenuOrder: Record<string, number> = {};
    sidemenuLinks[BrandingEnum.learncard].forEach((linkInfo, index) => {
        sidemenuOrder[linkInfo.name] = index;
    });

    // Handle AI session categories
    let aiSessionCategories: {
        [key: string]: {
            required: boolean;
            term: ConsentFlowTerms['write']['credentials']['categories'][string];
            setTerm: Updater<ConsentFlowTerms['write']['credentials']['categories'][string]>;
        };
    } = {};

    const orderedCategories = Object.entries(contract.credentials.categories)
        .map(([category, { required }]) => {
            const info = getInfoFromContractKey(category);
            return { category, required, order: sidemenuOrder[info.title] ?? -1 };
        })
        .sort((a, b) => a.order - b.order);

    // Process credential categories and separate AI session categories
    let credentialCategories = orderedCategories.map(({ category, required }) => {
        if (ALL_AI_CREDENTIAL_TYPES.includes(category)) {
            aiSessionCategories[category] = {
                required,
                term: terms.credentials.categories[category] ?? false,
                setTerm: updateCategory(category),
            };
            return undefined;
        }

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
    });

    // Filter out undefined values and add AI Sessions item if needed
    const filteredCategories = credentialCategories.filter(Boolean) as JSX.Element[];

    if (Object.keys(aiSessionCategories).length > 0) {
        filteredCategories.unshift(
            <ConsentFlowAiSessionsWriteItem
                key="ai-sessions"
                aiSessionCategories={aiSessionCategories}
                contractDetails={contractDetails}
                app={app}
            />
        );
    }

    credentialCategories = filteredCategories;

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
        <ul className="bg-white rounded-[8px] w-full flex flex-col overflow-hidden">
            {showCategories && credentialCategories}
            {showPersonal && personalItems}
        </ul>
    );
};

export default ConsentFlowWriteSharing;
