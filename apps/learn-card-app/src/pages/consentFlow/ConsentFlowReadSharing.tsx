import React from 'react';
import { Updater } from 'use-immer';
import {
    ConsentFlowContractDetails,
    ConsentFlowContract,
    ConsentFlowTerms,
} from '@learncard/types';
import { curriedStateSlice } from '@learncard/helpers';
import { useCurrentUser, BrandingEnum } from 'learn-card-base';
import { LaunchPadAppListItem } from 'learn-card-base';

import ConsentFlowReadSharingItem from './ConsentFlowReadSharingItem';
import ConsentFlowWriteSharingItem from './ConsentFlowWriteSharingItem';
import ConsentFlowAiSessionsReadItem from './ConsentFlowAiSessionsReadItem';

import { sidemenuLinks } from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import {
    AI_CONTRACT_CREDENTIAL_TYPE_OVERRIDES,
    getInfoFromContractKey,
    getPersonalEntry,
} from '../../helpers/contract.helpers';

type ConsentFlowReadSharingProps = {
    contract: ConsentFlowContract['read'];
    terms: ConsentFlowTerms['read'];
    setState: Updater<ConsentFlowTerms['read']>;
    contractOwnerDid: string;
    showCategories?: boolean;
    showPersonal?: boolean;

    contractDetails: ConsentFlowContractDetails;
    app?: LaunchPadAppListItem;
};

const ConsentFlowReadSharing: React.FC<ConsentFlowReadSharingProps> = ({
    contract,
    terms,
    setState,
    contractOwnerDid,
    showCategories = true,
    showPersonal = true,
    contractDetails,
    app,
}) => {
    const currentUser = useCurrentUser();
    const updateSlice = curriedStateSlice(setState);
    const updateCredentials = updateSlice('credentials');
    const updateCategories = curriedStateSlice(updateCredentials)('categories');
    const updateCategory = curriedStateSlice(updateCategories);
    const updatePersonal = curriedStateSlice(updateSlice('personal'));

    const sidemenuOrder: Record<string, number> = {};
    sidemenuLinks[BrandingEnum.learncard].forEach((linkInfo, index) => {
        sidemenuOrder[linkInfo.name] = index;
    });

    const orderedCategories = Object.entries(contract.credentials.categories)
        .map(([category, { required }]) => {
            const info = getInfoFromContractKey(category);
            return { category, required, order: sidemenuOrder[info.title] ?? -1 };
        })
        .sort((a, b) => a.order - b.order);

    let aiSessionCategories: {
        [key: string]: {
            required: boolean;
            term: ConsentFlowTerms['read']['credentials']['categories'][string];
            setTerm: Updater<ConsentFlowTerms['read']['credentials']['categories'][string]>;
        };
    } = {};

    let credentialCategories = orderedCategories.map(({ category, required }) => {
        if (AI_CONTRACT_CREDENTIAL_TYPE_OVERRIDES.includes(category)) {
            aiSessionCategories[category] = {
                required,
                term: terms.credentials.categories[category] ?? {
                    shareAll: false,
                    shared: [], // boost uris
                    sharing: false,
                },
                setTerm: updateCategory(category),
            };
            return undefined;
        }

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
    });

    if (Object.keys(aiSessionCategories).length > 0) {
        credentialCategories = [
            <ConsentFlowAiSessionsReadItem
                key="ai-sessions"
                aiSessionCategories={aiSessionCategories}
                contractDetails={contractDetails}
                app={app}
                contractOwnerDid={contractOwnerDid}
            />,
            ...credentialCategories,
        ];
    }

    const personalItems = Object.entries(contract.personal).map(([key, { required }]) => {
        const term = Boolean(terms.personal[key] ?? false);

        return (
            <ConsentFlowWriteSharingItem
                key={key}
                term={term}
                setTerm={newTerm =>
                    updatePersonal(
                        key,
                        newTerm ? getPersonalEntry(key, currentUser, terms.anonymize) : ''
                    )
                }
                category={key}
                required={required}
                isAnonymous={terms.anonymize}
                isPersonal
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

export default ConsentFlowReadSharing;
