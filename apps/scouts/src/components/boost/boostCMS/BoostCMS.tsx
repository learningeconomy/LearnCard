// oxlint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonCol, IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';
import BoostCMSHeader from './BoostCMSHeader/BoostCMSHeader';
import BoostAddressBook, {
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from './boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import BoostCMSTitleForm from './boostCMSForms/boostCMSTitleForm/BoostCMSTitleForm';
import BoostCMSBasicInfoForm from './boostCMSForms/boostCMSBasicInfo/BoostCMSBasicInfoForm';
import BoostCMSAppearanceController from './boostCMSForms/boostCMSAppearance/BoostCMSAppearanceController';
import BoostCMSMediaForm from './boostCMSForms/boostCMSMedia/BoostCMSMediaForm';
import BoostPreview from './BoostPreview/BoostPreview';
import BoostPreviewFooter from './BoostPreview/BoostPreviewFooter';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import BoostLoader from '../boostLoader/BoostLoader';
import BoostCMSConfirmationPrompt from './BoostCMSConfirmationPrompts/BoostCMSConfirmationPrompt';
import BoostCMSPublish from './boostCMSForms/boostCMSPublish/boostCMSPublish';
import BoostSuccessConfirmation from './BoostSuccessConfirmation/BoostSuccessConfirmation';
import BoostPreviewBody from './BoostPreview/BoostPreviewBody';
import BoostCMSIDAppearanceController from './boostCMSForms/boostCMSAppearance/BoostCMSIDAppearanceController';
import BoostCMSIDCard from '../boost-id-card/BoostIDCard';
import BoostCMSCustomTypeForm from './boostCMSForms/boostCMSTitleForm/BoostCMSCustomTypeForm';
import BoostFrameworkSkillSelector from './boostCMSForms/boostCMSSkills/BoostFrameworkSkillSelector';

import { useAddCredentialToWallet } from '../mutations';

import {
    BoostCMSStepsEnum,
    initialBoostCMSState,
    initialCustomBoostTypesState,
    LCNBoostStatusEnum,
} from '../boost';
import {
    BOOST_CATEGORY_TO_WALLET_ROUTE,
    boostCategoryOptions,
    BoostUserTypeEnum,
} from '../boost-options/boostOptions';
import {
    addBoostSomeone,
    addAdmin,
    getBoostCredentialPreview,
    getBoostVerificationPreview,
    getDefaultAchievementTypeImage,
    getDefaultBoostCriteria,
    getDefaultBoostDescription,
    getDefaultBoostTitle,
    getDefaultIDBackgroundImage,
    getDefaultIssuerImage,
    sendBoostCredential,
    addFallbackNameToCMSState,
} from '../boostHelpers';
import { extractSkillIdsFromAlignments } from '../alignmentHelpers';
import {
    BrandingEnum,
    BoostCMSState,
    getAchievementTypeFromCustomType,
    isCustomBoostType,
    ProfilePicture,
    replaceUnderscoresWithWhiteSpace,
    useCurrentUser,
    useGetProfile,
    useGetSearchProfiles,
    usePathQuery,
    useCreateBoost,
    setIonicModalBackground,
    resetIonicModalBackground,
    useGetCurrentUserTroopIds,
    useModal,
    ModalTypes,
    BoostCategoryOptionsEnum,
    useToast,
    ToastTypeEnum,
    useGetBoostPermissions,
} from 'learn-card-base';

import useFirebaseAnalytics from '../../../hooks/useFirebaseAnalytics';
import useWallet from 'learn-card-base/hooks/useWallet';
import { useQueryClient } from '@tanstack/react-query';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useScoutPassStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import boostSearchStore from 'apps/scouts/src/stores/boostSearchStore';

const BoostCMS: React.FC<{
    category?: BoostCategoryOptionsEnum;
    showCustomTypeInput?: boolean;
    achievementType?: string;
    boostUserType?: BoostUserTypeEnum;
    handleCloseModal?: () => void;
    parentUri?: string;
    overrideCustomize?: boolean;
}> = ({
    category,
    achievementType,
    boostUserType,
    handleCloseModal,
    parentUri,
    showCustomTypeInput,
}) => {
    const flags = useFlags();
    const history = useHistory();
    const location = useLocation();
    const query = usePathQuery();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const queryClient = useQueryClient();
    const currentUser = useCurrentUser();

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const { data: boostPermissionData } = useGetBoostPermissions(parentUri);

    const { data: myTroopIdData } = useGetCurrentUserTroopIds();

    let overrideCustomize = boostPermissionData?.canCreateChildren ? true : false;

    if (boostPermissionData === undefined) {
        overrideCustomize =
            myTroopIdData?.isNationalAdmin || myTroopIdData?.isScoutGlobalAdmin ? true : false;
    }

    const { mutateAsync: createBoost } = useCreateBoost();

    const [search, setSearch] = useState<string>('');
    const { data: boostAppearanceBadgeList, isLoading: stylePackLoading } =
        useScoutPassStylesPackRegistry();
    const { data: searchResults, isLoading: loading } = useGetSearchProfiles(search ?? '');
    const { mutate: addCredentialToWallet } = useAddCredentialToWallet();
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const _boostCategoryType =
        category || (query.get('boostCategoryType') as BoostCategoryOptionsEnum);
    const _boostSubCategoryType = achievementType || query.get('boostSubCategoryType');
    const _boostUserType = boostUserType || (query.get('boostUserType') as BoostUserTypeEnum);
    const _otherUserProfileId = query.get('otherUserProfileId') ?? '';

    const { data: profile } = useGetProfile();

    const [state, setState] = useState<BoostCMSState>({
        ...initialBoostCMSState,
        basicInfo: {
            ...initialBoostCMSState.basicInfo,
            name: getDefaultBoostTitle(_boostCategoryType, _boostSubCategoryType),
            description: getDefaultBoostDescription(_boostCategoryType, _boostSubCategoryType),
            narrative: getDefaultBoostCriteria(_boostCategoryType, _boostSubCategoryType),
            type: _boostCategoryType, // main category
            achievementType: _boostSubCategoryType, // sub category type
        },
        appearance: {
            ...initialBoostCMSState.appearance,
            badgeThumbnail: getDefaultAchievementTypeImage(
                _boostCategoryType,
                _boostSubCategoryType,
                boostCategoryOptions[_boostCategoryType]?.CategoryImage,
                boostAppearanceBadgeList
            ),
            idBackgroundImage: getDefaultIDBackgroundImage(_boostCategoryType),
            idIssuerThumbnail: getDefaultIssuerImage(_boostCategoryType),
        },
    });

    const [customTypes, setCustomTypes] = useState<any>(initialCustomBoostTypesState);

    const [currentStep, setCurrentStep] = useState<BoostCMSStepsEnum>(BoostCMSStepsEnum.create);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPublishLoading, setIsPublishLoading] = useState<boolean>(false);
    const [isSaveLoading, setIsSaveLoading] = useState<boolean>(false);

    const [publishedBoostUri, setPublishedBoostUri] = useState<string | null>(null);

    const isID = _boostCategoryType === BoostCategoryOptionsEnum.id;
    const isMembership = _boostCategoryType === BoostCategoryOptionsEnum.membership;
    const isMeritBadge = _boostCategoryType === BoostCategoryOptionsEnum.meritBadge;

    const issueToLength = state?.issueTo?.length || 0;

    useEffect(() => {
        const loadOtherUser = async () => {
            const wallet = await initWallet();

            if (_otherUserProfileId) {
                const otherUser = await wallet?.invoke?.getProfile(_otherUserProfileId);

                const userAlreadyExists = state?.issueTo.find(
                    issuee => issuee.profileId === otherUser?.profileId
                );

                if (userAlreadyExists) {
                    return;
                } else {
                    if (otherUser) {
                        setState(prevState => {
                            return {
                                ...prevState,
                                issueTo: [...prevState.issueTo, otherUser],
                            };
                        });
                    }
                }
            }
        };

        loadOtherUser();
    }, [location.search, _otherUserProfileId]);

    useEffect(() => {
        if (isCustomBoostType(_boostSubCategoryType)) {
            const customTypeTitle = replaceUnderscoresWithWhiteSpace(
                getAchievementTypeFromCustomType(_boostSubCategoryType)
            );

            setCustomTypes(prevState => {
                return {
                    ...prevState,
                    [_boostCategoryType]: [
                        ...prevState?.[_boostCategoryType],
                        {
                            title: customTypeTitle,
                            type: _boostSubCategoryType,
                        },
                    ],
                };
            });
        }

        // set default image after style pack has loaded
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState.appearance,
                    badgeThumbnail: getDefaultAchievementTypeImage(
                        _boostCategoryType,
                        _boostSubCategoryType,
                        boostCategoryOptions[_boostCategoryType]?.CategoryImage,
                        boostAppearanceBadgeList
                    ),
                },
            };
        });
    }, [stylePackLoading]);

    useEffect(() => {
        boostSearchStore.set.reset();
    }, []);

    const handleCategoryAndTypeChange = (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => {
        const _badgeThumbnail = getDefaultAchievementTypeImage(
            categoryType,
            achievementType,
            state?.appearance?.badgeThumbnail,
            boostAppearanceBadgeList
        );

        let boostTitle;
        let description;
        let criteria;
        if (
            categoryType === BoostCategoryOptionsEnum.id ||
            categoryType === BoostCategoryOptionsEnum.membership ||
            categoryType === BoostCategoryOptionsEnum.socialBadge ||
            categoryType === BoostCategoryOptionsEnum.meritBadge
        ) {
            // default ID title to selected achievementType
            boostTitle = getDefaultBoostTitle(categoryType, achievementType);
            description = getDefaultBoostDescription(categoryType, achievementType);
            criteria = getDefaultBoostCriteria(categoryType, achievementType);
        } else if (
            (_boostCategoryType === BoostCategoryOptionsEnum.id &&
                categoryType !== BoostCategoryOptionsEnum.id) ||
            (_boostCategoryType === BoostCategoryOptionsEnum.membership &&
                categoryType !== BoostCategoryOptionsEnum.membership)
        ) {
            // clear title when switching away from the ID category
            boostTitle = '';
            description = '';
            criteria = '';
        } else {
            boostTitle = state?.basicInfo?.name;
            description = state?.basicInfo?.description;
            criteria = state?.basicInfo?.narrative;
        }

        setState({
            ...state,
            basicInfo: {
                ...state.basicInfo,
                name: boostTitle,
                description: description,
                narrative: criteria,
                type: categoryType,
                achievementType: achievementType,
            },
            appearance: {
                ...state.appearance,
                badgeThumbnail: _badgeThumbnail,
            },
        });

        let link = `/boost?boostUserType=${_boostUserType}&boostCategoryType=${categoryType}&boostSubCategoryType=${achievementType}`;
        if (_otherUserProfileId) {
            link = `${link}&otherUserProfileId=${_otherUserProfileId}`;
        }
        history.replace(link);
    };

    const handleNextStep = () => {
        if (currentStep === BoostCMSStepsEnum.create) {
            setCurrentStep(BoostCMSStepsEnum.publish);
            logAnalyticsEvent('boostCMS_publish', {
                timestamp: Date.now(),
                action: 'publish',
                boostType: state?.basicInfo?.achievementType as any,
                category: state?.basicInfo?.type as any,
            });
        } else if (currentStep === BoostCMSStepsEnum.publish) {
            setCurrentStep(BoostCMSStepsEnum.issueTo);
            logAnalyticsEvent('boostCMS_issue_to', {
                timestamp: Date.now(),
                action: 'issue_to',
                boostType: state?.basicInfo?.achievementType as any,
                category: state?.basicInfo?.type as any,
            });
        }
    };

    const handlePrevStep = () => {
        if (currentStep === BoostCMSStepsEnum.publish) {
            setCurrentStep(BoostCMSStepsEnum.create);
        } else if (currentStep === BoostCMSStepsEnum.issueTo) {
            handleConfirmationModal();
        }
    };

    const handlePreview = async () => {
        openPreview();
    };

    const handleAddAdmin = async (wallet: BespokeLearnCard, boostUri: string) => {
        await Promise.all(
            state?.admins.map(async issuee => {
                const adminForBoost = await addAdmin(wallet, boostUri, issuee?.profileId);
                return adminForBoost;
            })
        );
    };

    const handleSaveAndQuit = async (goBack: boolean = false) => {
        const wallet = await initWallet();

        try {
            setIsSaveLoading(true);

            const skillIds = extractSkillIdsFromAlignments(state?.alignments ?? []);

            const { boostUri } = await createBoost({
                parentUri,
                state: addFallbackNameToCMSState(state),
                status: LCNBoostStatusEnum.draft,
                skillIds,
            });

            queryClient.invalidateQueries({ queryKey: ['boosts', state.basicInfo.type] });
            queryClient.invalidateQueries({
                queryKey: ['useGetPaginatedBoostChildren', parentUri],
            });
            queryClient.invalidateQueries({
                queryKey: ['useCountBoostChildren', parentUri],
            });

            queryClient.invalidateQueries({
                queryKey: ['useGetPaginatedFamilialBoosts', parentUri],
            });
            queryClient.invalidateQueries({
                queryKey: ['useCountFamilialBoosts', parentUri],
            });

            queryClient.invalidateQueries({
                queryKey: ['useCountFamilialBoosts'],
            });

            if (boostUri && state?.admins?.length > 0) {
                if (wallet) handleAddAdmin(wallet, boostUri);
            }

            if (boostUri) {
                setIsSaveLoading(false);
                presentToast('Boost saved successfully', {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });

                logAnalyticsEvent('boostCMS_publish_draft', {
                    timestamp: Date.now(),
                    action: 'publish_draft',
                    boostType: state?.basicInfo?.achievementType,
                    category: state?.basicInfo?.type,
                });

                if (!handleCloseModal) {
                    history.replace(
                        `/${BOOST_CATEGORY_TO_WALLET_ROUTE?.[state?.basicInfo?.type]}?managed=true`
                    );
                } else {
                    handleCloseModal?.();
                }
            }
        } catch (e) {
            setIsSaveLoading(false);
            console.log('error::savingBoost', e);
            presentToast('Unable to save boost', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handlePublishBoost = async () => {
        const wallet = await initWallet();

        try {
            setIsPublishLoading(true);

            const skillIds = extractSkillIdsFromAlignments(state?.alignments ?? []);

            const { boostUri } = await createBoost({
                parentUri,
                state: addFallbackNameToCMSState(state),
                status: LCNBoostStatusEnum.live,
                skillIds,
            });
            queryClient.invalidateQueries({
                queryKey: ['useCountFamilialBoosts', parentUri],
            });

            setIsPublishLoading(false);
            if (boostUri) {
                logAnalyticsEvent('boostCMS_publish_live', {
                    timestamp: Date.now(),
                    action: 'publish_live',
                    boostType: state?.basicInfo?.achievementType,
                    category: state?.basicInfo?.type,
                });

                setPublishedBoostUri(boostUri);

                if (_otherUserProfileId && state.issueTo?.length > 0) {
                    // if we're issuing to a specific person, issue immediately after publishing
                    handleSaveAndIssue(boostUri);
                } else {
                    handleNextStep();
                }
            }
            if (boostUri && state?.admins?.length > 0) {
                if (wallet) handleAddAdmin(wallet, boostUri);
            }
        } catch (e) {
            setIsPublishLoading(false);
            console.log('error::boosting::someone', e);
            presentToast('Error issuing boost', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleSaveAndIssue = async (boostUri?: string | null) => {
        const wallet = await initWallet();

        try {
            setIsLoading(true);
            if (boostUri && (issueToLength || 0) > 0) {
                const uris = await Promise.all(
                    state?.issueTo.map(async issuee => {
                        // handle self boosting
                        if (issuee?.profileId === profile?.profileId) {
                            console.log('boostUri', boostUri);
                            console.log(
                                'boost',
                                await (wallet?.invoke as any)?.resolveFromLCN(boostUri)
                            );
                            // oxlint-disable-next-line no-unused-vars
                            const { sentBoost } = await sendBoostCredential(
                                wallet as any,
                                profile?.profileId as string,
                                boostUri
                            );
                            //in future allow user to set storage option, eg ceramic or LCN
                            // const uri = await wallet?.store['LearnCard Network'].uploadEncrypted(sentBoost);
                            const issuedVcUri = await (
                                wallet?.store as any
                            )?.LearnCloud?.uploadEncrypted?.(sentBoost);

                            await addCredentialToWallet({ uri: issuedVcUri });
                            return issuedVcUri;
                        }

                        // handle boosting someone else
                        const issuedVc = await addBoostSomeone(
                            wallet as any,
                            issuee?.profileId as string,
                            boostUri
                        );
                        return issuedVc;
                    })
                );

                queryClient.invalidateQueries({
                    queryKey: ['useGetPaginatedBoostChildren', parentUri],
                });
                queryClient.invalidateQueries({
                    queryKey: ['useCountBoostChildren', parentUri],
                });

                queryClient.invalidateQueries({
                    queryKey: ['useGetPaginatedFamilialBoosts', parentUri],
                });
                queryClient.invalidateQueries({
                    queryKey: ['useCountFamilialBoosts', parentUri],
                });

                if (uris.length > 0) {
                    setIsLoading(false);
                    presentToast('Boost issued successfully', {
                        type: ToastTypeEnum.Success,
                        hasDismissButton: true,
                    });
                    if (!handleCloseModal) {
                        history.goBack();
                    }
                    handleCloseModal?.();
                }
            } else {
                setIsSaveLoading(true);

                if (boostUri) {
                    setIsSaveLoading(false);
                    presentToast('Boost saved successfully', {
                        type: ToastTypeEnum.Success,
                        hasDismissButton: true,
                    });
                    if (!handleCloseModal) {
                        history.goBack();
                    }
                    handleCloseModal?.();
                }
            }
        } catch (e) {
            setIsLoading(false);
            console.log('error::boosting::someone', e);
            presentToast('Error issuing boost', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const { newModal: newPreviewModal, closeModal: closePreviewModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const openPreview = async () => {
        if (isID || isMeritBadge) {
            setIonicModalBackground(state?.appearance?.backgroundImage);
        }

        newPreviewModal(
            <BoostPreview
                credential={getBoostCredentialPreview(state) as any}
                categoryType={state?.basicInfo?.type as any}
                verificationItems={getBoostVerificationPreview(state) as any}
                handleCloseModal={closePreviewModal}
                customThumbComponent={
                    isID || isMembership ? (
                        <BoostCMSIDCard
                            state={state}
                            setState={setState}
                            idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                            idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
                            customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                        />
                    ) : (
                        <CredentialBadge
                            achievementType={state?.basicInfo?.achievementType as any}
                            boostType={state?.basicInfo?.type as any}
                            badgeThumbnail={state?.appearance?.badgeThumbnail as string}
                            badgeCircleCustomClass="w-[170px] h-[170px]"
                            branding={BrandingEnum.scoutPass}
                            showBackgroundImage={false}
                            backgroundImage={state?.appearance?.backgroundImage ?? ''}
                            backgroundColor={state?.appearance?.backgroundColor ?? ''}
                            credential={getBoostCredentialPreview(state) as any}
                        />
                    )
                }
                customBodyCardComponent={
                    issueToLength > 0 ? (
                        <BoostPreviewBody
                            recipients={state?.issueTo}
                            customBoostPreviewContainerClass="bg-white"
                            customBoostPreviewContainerRowClass="items-center"
                        />
                    ) : isMeritBadge ? undefined : (
                        <div />
                    )
                }
                customFooterComponent={
                    <BoostPreviewFooter
                        handleSaveAndQuit={handleSaveAndQuit}
                        isSaveLoading={isSaveLoading}
                        handleSubmit={handlePublishBoost}
                        isLoading={isLoading}
                        showIssueButton={currentStep === BoostCMSStepsEnum.publish}
                        showSaveAndQuitButton={currentStep !== BoostCMSStepsEnum.confirmation}
                        selectedVCType={state?.basicInfo?.type as any}
                    />
                }
                boostPreviewWrapperCustomClass={issueToLength > 0 ? '' : 'boost-preview-wrapper'}
                issueeOverride={isMeritBadge ? 'Scout' : undefined}
                issuerOverride={isMeritBadge ? currentUser?.name : undefined}
                issuerImageComponent={isMeritBadge ? <ProfilePicture /> : undefined}
                customIssueHistoryComponent={undefined as any}
            />,
            {
                onClose: () => {
                    resetIonicModalBackground();
                },
            }
        );
    };

    const handleConfirmationModal = () => {
        const buttonText =
            currentStep === BoostCMSStepsEnum.issueTo ? 'Continue Issuing' : 'Continue Editing';
        newModal(
            <BoostCMSConfirmationPrompt
                state={state}
                skipHistoryGoBack={handleCloseModal ? true : false}
                handleSaveAndQuit={handleSaveAndQuit}
                currentStep={currentStep}
                isEditMode={false}
                isSaveLoading={isSaveLoading}
            />,
            { sectionClassName: '!max-w-[400px]', cancelButtonTextOverride: buttonText }
        );
    };

    let activeBoostCMSStep = null;

    if (currentStep === BoostCMSStepsEnum.create) {
        const appearanceController =
            isID || isMembership ? (
                <BoostCMSIDAppearanceController
                    state={state}
                    setState={setState}
                    boostUserType={_boostUserType}
                    handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                    customTypes={customTypes}
                    setCustomTypes={setCustomTypes}
                />
            ) : (
                <BoostCMSAppearanceController
                    state={state}
                    setState={setState}
                    boostUserType={_boostUserType}
                    handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                    customTypes={customTypes}
                    setCustomTypes={setCustomTypes}
                />
            );

        activeBoostCMSStep = (
            <>
                {appearanceController}

                <BoostCMSTitleForm
                    state={state}
                    overrideCustomize={overrideCustomize}
                    setState={setState}
                    showTitle={showCustomTypeInput}
                    disabled={!overrideCustomize}
                />

                {showCustomTypeInput && (
                    <BoostCMSCustomTypeForm
                        state={state}
                        setState={setState}
                        disabled={!overrideCustomize}
                    />
                )}

                {!flags?.disableCmsCustomization && (
                    <BoostCMSMediaForm state={state} setState={setState} />
                )}

                <BoostCMSBasicInfoForm
                    state={state}
                    setState={setState}
                    overrideCustomize={overrideCustomize}
                />

                {/* Framework-based skill selector (new) */}
                <BoostFrameworkSkillSelector state={state} setState={setState} />

                <BoostAddressBook
                    state={state}
                    setState={setState}
                    mode={BoostAddressBookEditMode.delete}
                    viewMode={BoostAddressBookViewMode.list}
                    search={search}
                    setSearch={setSearch}
                    searchResults={searchResults}
                    isLoading={loading}
                    boostUri={publishedBoostUri}
                    collectionPropName="admins"
                    showContactOptions={false}
                    title="Assign Admins"
                    hideBoostShareableCode
                />
            </>
        );
    } else if (currentStep === BoostCMSStepsEnum.publish) {
        activeBoostCMSStep = (
            <BoostCMSPublish
                state={state}
                handlePreview={handlePreview}
                handleSaveAndQuit={handleSaveAndQuit}
                handlePublishBoost={handlePublishBoost}
                showSaveAsDraftButton
                isSaveLoading={isSaveLoading}
                isPublishLoading={isPublishLoading}
            />
        );
    } else if (currentStep === BoostCMSStepsEnum.issueTo) {
        activeBoostCMSStep = (
            <BoostAddressBook
                state={state}
                setState={setState}
                mode={BoostAddressBookEditMode.delete}
                viewMode={BoostAddressBookViewMode.list}
                search={search}
                setSearch={setSearch}
                searchResults={searchResults}
                isLoading={loading}
                boostUri={publishedBoostUri}
            />
        );
    } else if (currentStep === BoostCMSStepsEnum.confirmation) {
        activeBoostCMSStep = (
            <BoostSuccessConfirmation state={state} handlePreview={handlePreview} />
        );
    }

    let loadingText = '';
    if (isLoading) {
        loadingText = 'Sending...';
    } else if (isPublishLoading) {
        loadingText = 'Sending...';
    } else if (isSaveLoading) {
        loadingText = 'Saving...';
    } else if (stylePackLoading) {
        loadingText = 'Loading...';
    }

    return (
        <IonPage>
            {(isLoading || isSaveLoading || isPublishLoading || stylePackLoading) && (
                <BoostLoader text={loadingText} darkBackground />
            )}

            <BoostCMSHeader
                boostUserType={_boostUserType}
                selectedVCType={state.basicInfo.type}
                currentStep={currentStep}
                handleNextStep={handleNextStep}
                handlePrevStep={handlePrevStep}
                handleConfirmationModal={handleConfirmationModal}
                publishedBoostUri={publishedBoostUri}
                handleSaveAndIssue={handleSaveAndIssue}
                isLoading={isLoading}
                issueToLength={issueToLength}
            />

            <IonContent fullscreen color="grayscale-800">
                <IonGrid className="flex items-center justify-center flex-col w-full px-4">
                    {activeBoostCMSStep}
                </IonGrid>
                {currentStep !== BoostCMSStepsEnum.confirmation && (
                    <IonRow className="w-full flex items-center justify-center pb-[200px]">
                        <IonCol className="w-full flex items-center justify-center">
                            <button onClick={handleConfirmationModal} className="mt-4 pb-4">
                                Quit
                            </button>
                        </IonCol>
                    </IonRow>
                )}
            </IonContent>
        </IonPage>
    );
};

export default BoostCMS;
