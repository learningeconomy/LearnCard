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
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import useConsentFlow from './useConsentFlow';
import useGuardianGate from 'src/hooks/useGuardianGate';

import { IonToggle } from '@ionic/react';
import ConsentFlowFooter from './ConsentFlowFooter';
import ConsentFlowReadSharing from './ConsentFlowReadSharing';
import ConsentFlowWriteSharing from './ConsentFlowWriteSharing';
import ContractPermissionsAndDetailsText from './ContractPermissionsAndDetailsText';
import PrivacyAndDataHeader from './PrivacyAndDataHeader';
import ConsentFlowVerifiableDataSharingItem from './ConsentFlowVerifiableDataSharingItem';

import { curriedStateSlice } from '@learncard/helpers';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import * as m from '../../paraglide/messages.js';
import {
    getPrivacyAndDataInfo,
    isVerifiableDataContractCategory,
    VERIFIABLE_DATA_CONTRACT_CATEGORIES,
} from '../../helpers/contract.helpers';

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
    const brandingConfig = useBrandingConfig();
    const { guardedAction } = useGuardianGate();

    // Use passed termsUri/ownerDid if provided (e.g., from ManageDataSharingModal)
    // Otherwise fall back to useConsentFlow lookup
    const { updateTerms: hookUpdateTerms, updatingTerms: hookUpdatingTerms } = useConsentFlow(
        contractDetails,
        app
    );

    // Direct update mutation when we have the termsUri
    const { mutateAsync: directUpdateTerms, isPending: directUpdatingTerms } = useUpdateTerms(
        propTermsUri ?? '',
        propOwnerDid ?? contractDetails?.owner?.did ?? ''
    );

    const hasDirectUri = !!propTermsUri;
    const updatingTerms = hasDirectUri ? directUpdatingTerms : hookUpdatingTerms;

    const updateTerms = hasDirectUri
        ? async (
              terms: ConsentFlowTerms,
              shareDuration: { oneTimeShare: boolean; customDuration: string }
          ) => {
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
    const updateSlice = curriedStateSlice(setTerms);

    const updateRead = curriedStateSlice(updateSlice('read'));

    const updateWrite = curriedStateSlice(updateSlice('write'));
    const updateWriteCredentials = curriedStateSlice(updateWrite('credentials'));

    const { initWallet } = useWallet();
    const readTerms = {
        anonymize: false,
        personal: {},
        ...(terms.read ?? {}),
        credentials: {
            shareAll: false,
            sharing: false,
            ...(terms.read?.credentials ?? {}),
            categories: terms.read?.credentials?.categories ?? {},
        },
    } as ConsentFlowTerms['read'];
    const readCredentials = readTerms.credentials;

    useEffect(() => {
        const populateCredsForLiveSync = async () => {
            // we need to populate the terms.read.credentials.categories.[Category].shared array if live syncing (shareAll) is turned on
            //   this is because live sync only properly syncs *new* credentials, we need to populate the shared array for initial sharing
            //   Note: this has the side effect of always triggering the save condition if a user has more than 15 credentials in a category with shareAll
            //         since the contract terms endpoint only returns 15 uris
            const categoriesWithLiveSync = Object.keys(readCredentials.categories ?? {}).filter(
                category => readCredentials.categories?.[category]?.shareAll
            );

            if (categoriesWithLiveSync.length > 0) {
                setLoadingShareAllCredentials(true);
                try {
                    const wallet = await initWallet();

                    const updatedTerms = cloneDeep(terms);
                    updatedTerms.read ??= readTerms;
                    updatedTerms.read.credentials ??= {
                        shareAll: false,
                        sharing: false,
                        categories: {},
                    };
                    updatedTerms.read.credentials.categories ??= {};
                    await Promise.all(
                        categoriesWithLiveSync.map(async category => {
                            const allCategoryCredUris = (
                                await wallet.index.LearnCloud.get({ category })
                            ).map(item => item.uri);

                            updatedTerms.read.credentials.categories[category] = {
                                ...(updatedTerms.read.credentials.categories[category] ?? {
                                    shareAll: true,
                                    sharing: true,
                                    shared: [],
                                }),
                                shared: allCategoryCredUris,
                            };
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

    const handleUpdateVerifiableDataCategory = async (
        category: string,
        mode: 'liveSync' | 'shareOnce' | 'deny'
    ) => {
        try {
            if (mode === 'deny') {
                setTerms(draft => {
                    draft.read ??= {
                        anonymize: false,
                        credentials: { shareAll: false, sharing: false, categories: {} },
                        personal: {},
                    };

                    draft.read.credentials ??= {
                        shareAll: false,
                        sharing: false,
                        categories: {},
                    };
                    draft.read.credentials.categories ??= {};

                    draft.read.credentials.categories[category] = {
                        shareAll: false,
                        shared: [],
                        sharing: false,
                    };
                });
                return;
            }

            const wallet = await initWallet();
            const shared = (await wallet.index.LearnCloud.get({ category })).map(item => item.uri);

            setTerms(draft => {
                draft.read ??= {
                    anonymize: false,
                    credentials: { shareAll: false, sharing: false, categories: {} },
                    personal: {},
                };

                draft.read.credentials ??= { shareAll: false, sharing: false, categories: {} };
                draft.read.credentials.categories ??= {};

                draft.read.credentials.categories[category] = {
                    shareAll: mode === 'liveSync',
                    shared,
                    sharing: true,
                };
            });
        } catch (error) {
            presentToast('Connection issue. Please check your internet and try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const isUpdated = !isEqual(initialTerms, terms);

    const allReadToggle = Object.keys(readCredentials.categories ?? {})
        .filter(category => !isVerifiableDataContractCategory(category))
        .every(category => {
            const categoryState = readCredentials.categories?.[category];

            return Boolean(categoryState?.sharing && categoryState.shareAll);
        });
    const allWriteToggle = Object.values(terms.write.credentials.categories).every(Boolean);

    const handleToggleAllCategoryReadToggles = () => {
        updateSlice('read', oldRead => {
            Object.keys(oldRead.credentials.categories).forEach(key => {
                if (isVerifiableDataContractCategory(key)) {
                    return;
                }

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

    const contractCategoryReadCategories = Object.keys(
        contractDetails.contract.read.credentials.categories ?? {}
    );
    const contractCategoryReadDataExists = contractCategoryReadCategories.some(
        category => !isVerifiableDataContractCategory(category)
    );
    const contractPersonalReadCategories = Object.keys(
        contractDetails.contract.read.personal ?? {}
    );
    const verifiableDataCategories = VERIFIABLE_DATA_CONTRACT_CATEGORIES.filter(category =>
        contractCategoryReadCategories.includes(category)
    );
    const verifiableDataPersonalItems = verifiableDataCategories.map(category => (
        <ConsentFlowVerifiableDataSharingItem
            key={category}
            term={
                readTerms.credentials?.categories?.[category] ?? {
                    shareAll: false,
                    shared: [],
                    sharing: false,
                }
            }
            category={category}
            titleOverride={category === 'Role Experience' ? 'Experience in Role' : undefined}
            required={contractDetails.contract.read.credentials.categories[category]?.required}
            onModeChange={mode => handleUpdateVerifiableDataCategory(category, mode)}
        />
    ));
    const contractPersonalReadDataExists =
        contractPersonalReadCategories.length > 0 || verifiableDataCategories.length > 0;
    const contractCategoryWriteDataExists =
        Object.keys(contractDetails.contract.write.credentials.categories ?? {}).length > 0;
    // const contractPersonalWriteDataExists =
    //     Object.keys(contractDetails.contract.write.personal ?? {}).length > 0;

    const { name, image, appStyles } = getPrivacyAndDataInfo(contractDetails, app);

    const saveWord = updatingTerms ? m['consentFlow.saving']() : m['common.save']();

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
                            ? `Share Your ${brandingConfig?.name} Data`
                            : `This app is not able to read any credentials from your ${brandingConfig?.name}.`}
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
                                            {allReadToggle
                                                ? m['consentFlow.status.active']()
                                                : m['consentFlow.status.off']()}
                                        </output>
                                        <p className="font-notoSans text-grayscale-900 text-[20px]">
                                            {m['consentFlow.liveSyncAll']()}
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
                                    <span className="font-[600] font-notoSans">
                                        {m['consentFlow.sync.liveSyncing']()}
                                    </span>{' '}
                                    will automatically share all credentials as you get them. If
                                    it's turned off, you can selectively share specific wallet
                                    categories and credentials at any time
                                </p>
                            </div>

                            <ConsentFlowReadSharing
                                contract={contractDetails.contract.read}
                                terms={terms.read}
                                setState={updateSlice('read')}
                                contractOwnerDid={contractDetails.owner?.did}
                                showPersonal={false}
                                categoryFilter={category =>
                                    !isVerifiableDataContractCategory(category)
                                }
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
                                        {terms.read.anonymize
                                            ? m['consentFlow.status.on']()
                                            : m['consentFlow.status.off']()}
                                    </output>
                                    <p className="font-notoSans text-grayscale-900 text-[20px]">
                                        Anonymize
                                    </p>
                                </label>

                                <IonToggle
                                    mode="ios"
                                    className="[--background:white]"
                                    color="emerald-700"
                                    onClick={() => updateRead('anonymize', !readTerms.anonymize)}
                                    checked={readTerms.anonymize}
                                />
                            </div>

                            <p className="text-grayscale-600 text-[14px] font-notoSans">
                                Turning on{' '}
                                <span className="font-[600] font-notoSans">
                                    {m['consentFlow.anonymize']()}
                                </span>{' '}
                                will hide your name, profile picture, and email when sharing to this
                                app.
                            </p>
                        </div>

                        <ConsentFlowReadSharing
                            contract={contractDetails.contract.read}
                            terms={readTerms}
                            setState={updateSlice('read')}
                            contractOwnerDid={contractDetails.owner?.did}
                            showCategories={false}
                            showPersonal
                            extraPersonalItems={verifiableDataPersonalItems}
                        />
                    </div>
                )}

                <div className="text-grayscale-900 text-[14px] rounded-[15px] bg-white w-full p-[15px] flex flex-col gap-[20px] shadow-box-bottom">
                    <h4 className="text-grayscale-900 text-[20px] font-notoSans">
                        {contractCategoryWriteDataExists
                            ? `Allow ${name} to Add Data to Your ${brandingConfig?.name}`
                            : `This app is not able to write any data to your ${brandingConfig?.name}.`}
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
                                            {allWriteToggle
                                                ? m['consentFlow.status.active']()
                                                : m['consentFlow.status.off']()}
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
                                    <span className="font-[600] font-notoSans">
                                        {m['consentFlow.allowAll']()}
                                    </span>{' '}
                                    will let the app issue credentials and add them to your{' '}
                                    {brandingConfig?.name}. If turned off, you can selectively
                                    choose which wallet categories that the app can add to.
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
                            await guardedAction(async () => {
                                await updateTerms(terms, shareDuration);
                            });
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
                secondaryButtonText={isPostConsent ? m['common.cancel']() : m['common.back']()}
                onSecondaryButtonClick={async () => {
                    saveTerms?.(terms);
                    closeModal();
                }}
            />
        </div>
    );
};

export default ConsentFlowPrivacyAndData;
