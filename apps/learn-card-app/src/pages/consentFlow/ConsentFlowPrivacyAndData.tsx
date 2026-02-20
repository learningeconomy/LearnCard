import React, { useEffect, useState } from 'react';
import { cloneDeep, isEqual } from 'lodash-es';
import { Updater, useImmer } from 'use-immer';

import {
    useModal,
    useToast,
    ToastTypeEnum,
    LaunchPadAppListItem,
    useWallet,
    useUpdateTerms,
} from 'learn-card-base';
import useConsentFlow from './useConsentFlow';

import { IonToggle } from '@ionic/react';
import ConsentFlowFooter from './ConsentFlowFooter';
import ConsentFlowReadSharing from './ConsentFlowReadSharing';
import ConsentFlowWriteSharing from './ConsentFlowWriteSharing';
import ContractPermissionsAndDetailsText from './ContractPermissionsAndDetailsText';
import PrivacyAndDataHeader from './PrivacyAndDataHeader';

import { curriedStateSlice } from '@learncard/helpers';
import { getPrivacyAndDataInfo } from '../../helpers/contract.helpers';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

type ConsentFlowPrivacyAndDataProps = {
    contractDetails: ConsentFlowContractDetails;
    app?: LaunchPadAppListItem;
    terms: ConsentFlowTerms;
    setTerms: Updater<ConsentFlowTerms>;

    isPostConsent?: boolean;
    headerClass?: string;

    // Optional: pass these directly to avoid lookup issues
    termsUri?: string;
    ownerDid?: string;
};

// Based on ConsentFlowEditAccess
const ConsentFlowPrivacyAndData: React.FC<ConsentFlowPrivacyAndDataProps> = ({
    contractDetails,
    app,
    terms: initialTerms,
    setTerms: saveTerms,

    isPostConsent,
    headerClass,

    termsUri: propTermsUri,
    ownerDid: propOwnerDid,
}) => {
    const { closeModal } = useModal();
    const { presentToast } = useToast();

    // Use passed termsUri/ownerDid if provided (e.g., from ManageDataSharingModal)
    // Otherwise fall back to useConsentFlow lookup
    const { updateTerms: hookUpdateTerms, updatingTerms: hookUpdatingTerms } = useConsentFlow(contractDetails, app);

    // Direct update mutation when we have the termsUri
    const { mutateAsync: directUpdateTerms, isPending: directUpdatingTerms } = useUpdateTerms(
        propTermsUri ?? '',
        propOwnerDid ?? contractDetails?.owner?.did ?? ''
    );

    const hasDirectUri = !!propTermsUri;
    const updatingTerms = hasDirectUri ? directUpdatingTerms : hookUpdatingTerms;

    const updateTerms = hasDirectUri
        ? async (terms: ConsentFlowTerms, shareDuration: { oneTimeShare: boolean; customDuration: string }) => {
            await directUpdateTerms({
                terms,
                oneTime: shareDuration.oneTimeShare,
                expiresAt: shareDuration.customDuration,
            });
        }
        : hookUpdateTerms;

    const [terms, setTerms] = useImmer(initialTerms);
    const [shareDuration, setShareDuration] = useState<{
        oneTimeShare: boolean;
        customDuration: string;
    }>({ oneTimeShare: false, customDuration: '' });

    const [loadingShareAllCredentials, setLoadingShareAllCredentials] = useState(false);
    const { initWallet } = useWallet();
    useEffect(() => {
        const populateCredsForLiveSync = async () => {
            // we need to populate the terms.read.credentials.categories.[Category].shared array if live syncing (shareAll) is turned on
            //   this is because live sync only properly syncs *new* credentials, we need to populate the shared array for initial sharing
            //   Note: this has the side effect of always triggering the save condition if a user has more than 15 credentials in a category with shareAll
            //         since the contract terms endpoint only returns 15 uris
            const categoriesWithLiveSync = Object.keys(terms.read.credentials.categories).filter(
                category => terms.read.credentials.categories[category].shareAll
            );

            if (categoriesWithLiveSync.length > 0) {
                setLoadingShareAllCredentials(true);
                try {
                    const wallet = await initWallet();

                    const updatedTerms = cloneDeep(terms);
                    await Promise.all(
                        categoriesWithLiveSync.map(async category => {
                            const allCategoryCredUris = (
                                await wallet.index.LearnCloud.get({ category })
                            ).map(item => item.uri);

                            updatedTerms.read.credentials.categories[category].shared =
                                allCategoryCredUris;
                        })
                    );

                    const isUpdated = !isEqual(terms, updatedTerms);

                    if (isUpdated) {
                        setTerms(updatedTerms);
                    }
                } finally {
                    setLoadingShareAllCredentials(false);
                }
            }
        };

        populateCredsForLiveSync();
    }, [terms]);

    const isUpdated = !isEqual(initialTerms, terms);

    const updateSlice = curriedStateSlice(setTerms);

    const updateRead = curriedStateSlice(updateSlice('read'));

    const updateWrite = curriedStateSlice(updateSlice('write'));
    const updateWriteCredentials = curriedStateSlice(updateWrite('credentials'));

    const allReadToggle = Object.values(terms.read.credentials.categories).every(
        category => category.sharing && category.shareAll
    );
    const allWriteToggle = Object.values(terms.write.credentials.categories).every(Boolean);

    const handleToggleAllCategoryReadToggles = () => {
        updateSlice('read', oldRead => {
            Object.keys(oldRead.credentials.categories).forEach(key => {
                const category = oldRead.credentials.categories[key];
                const required =
                    contractDetails?.contract.read.credentials.categories[key]?.required;
                category.sharing = !allReadToggle || category.sharing || required;
                category.shareAll = !allReadToggle || required;
            });
        });
    };

    const handleToggleAllWriteToggles = () => {
        updateWriteCredentials('categories', oldCategories => {
            Object.keys(oldCategories).forEach(key => {
                oldCategories[key] =
                    !allWriteToggle ||
                    contractDetails?.contract.write.credentials.categories[key]?.required;
            });
        });
    };

    if (!contractDetails) {
        closeModal();

        return <></>;
    }

    const contractCategoryReadDataExists =
        Object.keys(contractDetails.contract.read.credentials.categories ?? {}).length > 0;
    const contractPersonalReadDataExists =
        Object.keys(contractDetails.contract.read.personal ?? {}).length > 0;
    const contractCategoryWriteDataExists =
        Object.keys(contractDetails.contract.write.credentials.categories ?? {}).length > 0;
    // const contractPersonalWriteDataExists =
    //     Object.keys(contractDetails.contract.write.personal ?? {}).length > 0;

    const { name, image, appStyles } = getPrivacyAndDataInfo(contractDetails, app);

    const saveWord = updatingTerms ? 'Saving...' : 'Save';

    return (
        <div className="h-full">
            <PrivacyAndDataHeader name={name} image={image} className={headerClass} />

            <div
                className="h-full w-full flex flex-col gap-[20px] overflow-y-auto p-[20px] pb-[300px]"
                style={appStyles}
            >
                <div className="text-grayscale-900 text-[14px] rounded-[15px] bg-white w-full p-[15px] flex flex-col gap-[10px] shadow-box-bottom">
                    <ContractPermissionsAndDetailsText
                        contractDetails={contractDetails}
                        app={app}
                        isPostConsent={isPostConsent}
                    />
                </div>

                <div className="text-grayscale-900 text-[14px] rounded-[15px] bg-white w-full p-[15px] flex flex-col gap-[20px] shadow-box-bottom">
                    <h4 className="text-grayscale-900 text-[20px] font-notoSans">
                        {contractCategoryReadDataExists
                            ? 'Share Your LearnCard Data'
                            : 'This app is not able to read any credentials from your LearnCard.'}
                    </h4>

                    {contractCategoryReadDataExists && (
                        <>
                            <div className="flex flex-col">
                                <div className="w-full flex justify-between items-center">
                                    <label className="flex flex-col gap-[2px]">
                                        <output
                                            className={`font-[600] text-[14px] font-notoSans ${
                                                allReadToggle
                                                    ? 'text-emerald-700'
                                                    : 'text-grayscale-500'
                                            }`}
                                        >
                                            {allReadToggle ? 'Active' : 'Off'}
                                        </output>
                                        <p className="font-notoSans text-grayscale-900 text-[20px]">
                                            Live Sync All
                                        </p>
                                    </label>

                                    <IonToggle
                                        mode="ios"
                                        className="[--background:white]"
                                        color="emerald-700"
                                        onClick={handleToggleAllCategoryReadToggles}
                                        checked={allReadToggle}
                                    />
                                </div>

                                <p className="text-grayscale-600 text-[14px] font-notoSans">
                                    Turning on{' '}
                                    <span className="font-[600] font-notoSans">Live Sync</span> will
                                    automatically share all credentials as you get them. If it's
                                    turned off, you can selectively share specific wallet categories
                                    and credentials at any time
                                </p>
                            </div>

                            <ConsentFlowReadSharing
                                contract={contractDetails.contract.read}
                                terms={terms.read}
                                setState={updateSlice('read')}
                                contractOwnerDid={contractDetails.owner?.did}
                                showPersonal={false}
                                contractDetails={contractDetails}
                                app={app}
                            />
                        </>
                    )}
                </div>

                {contractPersonalReadDataExists && (
                    <div className="text-grayscale-900 text-[14px] rounded-[15px] bg-white w-full p-[15px] flex flex-col gap-[20px] shadow-box-bottom">
                        <h4 className="text-grayscale-900 text-[20px] font-notoSans">
                            Share Your Personal Data
                        </h4>

                        <div className="flex flex-col">
                            <div className="w-full flex justify-between items-center">
                                <label className="flex flex-col gap-[2px]">
                                    <output
                                        className={`font-[600] text-[14px] font-notoSans ${
                                            terms.read.anonymize
                                                ? 'text-emerald-700'
                                                : 'text-grayscale-500'
                                        }`}
                                    >
                                        {terms.read.anonymize ? 'On' : 'Off'}
                                    </output>
                                    <p className="font-notoSans text-grayscale-900 text-[20px]">
                                        Anonymize
                                    </p>
                                </label>

                                <IonToggle
                                    mode="ios"
                                    className="[--background:white]"
                                    color="emerald-700"
                                    onClick={() => updateRead('anonymize', !terms.read.anonymize)}
                                    checked={terms.read.anonymize}
                                />
                            </div>

                            <p className="text-grayscale-600 text-[14px] font-notoSans">
                                Turning on{' '}
                                <span className="font-[600] font-notoSans">Anonymize</span> will
                                hide your name, profile picture, and email when sharing to this app.
                            </p>
                        </div>

                        <ConsentFlowReadSharing
                            contract={contractDetails.contract.read}
                            terms={terms.read}
                            setState={updateSlice('read')}
                            contractOwnerDid={contractDetails.owner?.did}
                            showCategories={false}
                        />
                    </div>
                )}

                <div className="text-grayscale-900 text-[14px] rounded-[15px] bg-white w-full p-[15px] flex flex-col gap-[20px] shadow-box-bottom">
                    <h4 className="text-grayscale-900 text-[20px] font-notoSans">
                        {contractCategoryWriteDataExists
                            ? `Allow ${name} to Add Data to Your LearnCard`
                            : 'This app is not able to write any data to your LearnCard.'}
                    </h4>

                    {contractCategoryWriteDataExists && (
                        <>
                            <div className="flex flex-col">
                                <div className="w-full flex justify-between items-center">
                                    <label className="flex flex-col gap-[2px]">
                                        <output
                                            className={`font-[600] text-[14px] font-notoSans ${
                                                allWriteToggle
                                                    ? 'text-emerald-700'
                                                    : 'text-grayscale-500'
                                            }`}
                                        >
                                            {allWriteToggle ? 'Active' : 'Off'}
                                        </output>
                                        <p className="font-notoSans text-grayscale-900 text-[20px]">
                                            Allow All
                                        </p>
                                    </label>

                                    <IonToggle
                                        mode="ios"
                                        className="[--background:white]"
                                        color="emerald-700"
                                        onClick={handleToggleAllWriteToggles}
                                        checked={allWriteToggle}
                                    />
                                </div>

                                <p className="text-grayscale-600 text-[14px] font-notoSans">
                                    Turning on{' '}
                                    <span className="font-[600] font-notoSans">Allow All</span> will
                                    let the app issue credentials and add them to your LearnCard. If
                                    turned off, you can selectively choose which wallet categories
                                    that the app can add to.
                                </p>
                            </div>

                            <ConsentFlowWriteSharing
                                contract={contractDetails.contract.write}
                                terms={terms.write}
                                setState={updateSlice('write')}
                                contractDetails={contractDetails}
                                app={app}
                            />
                        </>
                    )}
                </div>
            </div>
            <ConsentFlowFooter
                actionButtonText={isPostConsent ? saveWord : undefined}
                actionButtonDisabled={updatingTerms || loadingShareAllCredentials || !isUpdated}
                onActionButtonClick={async () => {
                    if (isPostConsent && isUpdated) {
                        try {
                            await updateTerms(terms, shareDuration);
                            closeModal();
                            presentToast('Successfully updated!', {
                                type: ToastTypeEnum.Success,
                            });
                        } catch (e) {
                            presentToast(`Failed to update terms: ${e.message}`, {
                                type: ToastTypeEnum.Error,
                            });
                        }
                    }
                }}
                secondaryButtonText={isPostConsent ? 'Cancel' : 'Back'}
                onSecondaryButtonClick={async () => {
                    saveTerms?.(terms);
                    closeModal();
                }}
            />
        </div>
    );
};

export default ConsentFlowPrivacyAndData;
