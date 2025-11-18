import React, { useEffect, useState, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    IonCol,
    IonContent,
    IonGrid,
    IonPage,
    IonRow,
    useIonModal,
    useIonToast,
} from '@ionic/react';
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
import BoostCMSSkillsAttachmentForm from './boostCMSForms/boostCMSSkills/BoostSkillAttachmentsForm';

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
    BoostCategoryOptionsEnum,
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
} from 'learn-card-base';

import useFirebaseAnalytics from '../../../hooks/useFirebaseAnalytics';
import useWallet from 'learn-card-base/hooks/useWallet';
import { useQueryClient } from '@tanstack/react-query';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useScoutPassStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { useGetBoostPermissions } from 'learn-card-base';
import { BadgePackOptionsEnum } from '../boost-select-menu/badge-pack.helper';
import boostSearchStore from '../../../stores/boostSearchStore';

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
    const [presentToast] = useIonToast();
    const queryClient = useQueryClient();
    const currentUser = useCurrentUser();

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const { data: boostPermissionData } = useGetBoostPermissions(parentUri);

    const { data: myTroopIdData, isLoading: troopIdDataLoading } = useGetCurrentUserTroopIds();

    let overrideCustomize = boostPermissionData?.canCreateChildren ? true : false;

    // if it is a "template" boost eg hardcoded boost pack it will have no permission data
    // for now simply base on if user is NSO admin or global admin
    // this is based on the document they provided

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
    const { newModal } = useModal();

    const _boostCategoryType = category || query.get('boostCategoryType');
    const _boostSubCategoryType = achievementType || query.get('boostSubCategoryType');
    const _boostUserType = boostUserType || query.get('boostUserType');
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

    const issueToLength = state?.issueTo?.length;

    useEffect(() => {
        const loadOtherUser = async () => {
            const wallet = await initWallet();

            if (_otherUserProfileId) {
                const otherUser = await wallet?.invoke?.getProfile(_otherUserProfileId);

                const userAlreadyExists = state?.issueTo.find(
                    issuee => issuee.profileId === otherUser.profileId
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
                    ...state?.appearance,
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
            dismissModal();
            setCurrentStep(BoostCMSStepsEnum.publish);
            logAnalyticsEvent('boostCMS_publish', {
                timestamp: Date.now(),
                action: 'publish',
                boostType: state?.basicInfo?.achievementType,
                category: state?.basicInfo?.type,
            });
        } else if (currentStep === BoostCMSStepsEnum.publish) {
            dismissModal();
            setCurrentStep(BoostCMSStepsEnum.issueTo);
            logAnalyticsEvent('boostCMS_issue_to', {
                timestamp: Date.now(),
                action: 'issue_to',
                boostType: state?.basicInfo?.achievementType,
                category: state?.basicInfo?.type,
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
        if (isID || isMeritBadge) {
            setIonicModalBackground(state?.appearance?.backgroundImage);
        }

        presentModal({
            backdropDismiss: true,
            showBackdrop: false,
            onWillDismiss: () => {
                resetIonicModalBackground();
            },
        });
    };

    const handleAddAdmin = async (wallet: BespokeLearnCard, boostUri: string) => {
        const adminForVC = await Promise.all(
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
            dismissModal();

            const { boostUri } = await createBoost({
                parentUri,
                state: addFallbackNameToCMSState(state),
                status: LCNBoostStatusEnum.draft,
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
                handleAddAdmin(wallet, boostUri);
            }

            if (boostUri) {
                setIsSaveLoading(false);
                presentToast({
                    message: `Boost saved successfully`,
                    duration: 3000,
                    cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
                    buttons: [{ text: 'Dismiss', role: 'cancel' }],
                    swipeGesture: 'vertical',
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
            presentToast({
                message: `Unable to save boost`,
                duration: 3000,
                cssClass: 'login-link-warning-toast ion-toast-bottom-nav-offset',
                buttons: [{ text: 'Dismiss', role: 'cancel' }],
                swipeGesture: 'vertical',
            });
        }
    };

    const handlePublishBoost = async () => {
        const wallet = await initWallet();

        try {
            setIsPublishLoading(true);
            dismissModal();
            const { boostUri } = await createBoost({
                parentUri,
                state: addFallbackNameToCMSState(state),
                status: LCNBoostStatusEnum.live,
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
                handleAddAdmin(wallet, boostUri);
            }
        } catch (e) {
            setIsPublishLoading(false);
            console.log('error::boosting::someone', e);
            presentToast({
                message: `Error issuing boost`,
                duration: 3000,
                cssClass: 'login-link-warning-toast ion-toast-bottom-nav-offset',
                buttons: [{ text: 'Dismiss', role: 'cancel' }],
                swipeGesture: 'vertical',
            });
        }
    };

    const handleSaveAndIssue = async (boostUri?: string | null) => {
        const wallet = await initWallet();

        try {
            setIsLoading(true);
            if (boostUri && issueToLength > 0) {
                const uris = await Promise.all(
                    state?.issueTo.map(async issuee => {
                        // handle self boosting
                        if (issuee?.profileId === profile?.profileId) {
                            const { sentBoost, sentBoostUri } = await sendBoostCredential(
                                wallet,
                                profile?.profileId,
                                boostUri
                            );
                            //in future allow user to set storage option, eg ceramic or LCN
                            // const uri = await wallet?.store['LearnCard Network'].uploadEncrypted(sentBoost);
                            const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(
                                sentBoost
                            );
                            await addCredentialToWallet({ uri: issuedVcUri });
                            return issuedVcUri;
                        }

                        // handle boosting someone else
                        const issuedVc = await addBoostSomeone(wallet, issuee?.profileId, boostUri);
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
                    presentToast({
                        message: `Boost issued successfully`,
                        duration: 3000,
                        cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
                        buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        swipeGesture: 'vertical',
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
                    presentToast({
                        message: `Boost saved successfully`,
                        duration: 3000,
                        cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
                        buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        swipeGesture: 'vertical',
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
            presentToast({
                message: `Error issuing boost`,
                duration: 3000,
                cssClass: 'login-link-warning-toast ion-toast-bottom-nav-offset',
                buttons: [{ text: 'Dismiss', role: 'cancel' }],
                swipeGesture: 'vertical',
            });
        }
    };

    const [presentModal, dismissModal] = useIonModal(BoostPreview, {
        credential: getBoostCredentialPreview(state),
        categoryType: state?.basicInfo?.type,
        verificationItems: getBoostVerificationPreview(state),
        handleCloseModal: () => dismissModal(),
        customThumbComponent:
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
                    achievementType={state?.basicInfo?.achievementType}
                    boostType={state?.basicInfo?.type}
                    badgeThumbnail={state?.appearance?.badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                    branding={BrandingEnum.scoutPass}
                />
            ),
        customBodyCardComponent:
            issueToLength > 0 ? (
                <BoostPreviewBody
                    recipients={state?.issueTo}
                    customBoostPreviewContainerClass="bg-white"
                    customBoostPreviewContainerRowClass="items-center"
                />
            ) : isMeritBadge ? undefined : (
                <div />
            ),
        customFooterComponent: (
            <BoostPreviewFooter
                handleSaveAndQuit={handleSaveAndQuit}
                isSaveLoading={isSaveLoading}
                handleSubmit={handlePublishBoost}
                isLoading={isLoading}
                showIssueButton={currentStep === BoostCMSStepsEnum.publish}
                showSaveAndQuitButton={currentStep !== BoostCMSStepsEnum.confirmation}
                selectedVCType={state?.basicInfo?.type}
            />
        ),
        boostPreviewWrapperCustomClass: issueToLength > 0 ? '' : 'boost-preview-wrapper',
        issueeOverride: isMeritBadge ? 'Scout' : undefined,
        issuerOverride: isMeritBadge ? currentUser?.name : undefined,
        issuerImageComponent: isMeritBadge ? <ProfilePicture /> : undefined,
    });

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
            { sectionClassName: '!max-w-[400px]', cancelButtonTextOverride: buttonText },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
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
                    <BoostCMSSkillsAttachmentForm state={state} setState={setState} />
                )}
                {!flags?.disableCmsCustomization && (
                    <BoostCMSMediaForm state={state} setState={setState} />
                )}

                <BoostCMSBasicInfoForm
                    state={state}
                    setState={setState}
                    overrideCustomize={overrideCustomize}
                />
                {/* {isMembership && <BoostIDCardCMSMembersForm state={state} setState={setState} />} */}
                {/* <BoostCMSAdvancedSettingsForm state={state} setState={setState} />
                <BoostCMSAIMissionForm state={state} setState={setState} />
                <BoostCMSAddChatForm state={state} setState={setState} />
                <BoostCMSMemberPrivacyOptions state={state} setState={setState} />
                <BoostCMSUserPermissions state={state} setState={setState} />
                <BoostCMSAdminsForm state={state} setState={setState} /> */}
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
