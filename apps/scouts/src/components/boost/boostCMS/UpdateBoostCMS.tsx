import React, { useEffect, useMemo, useState } from 'react';
import { deriveAlignmentsFromVC } from '../alignmentHelpers';
import { useHistory, useLocation } from 'react-router';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonCol, IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';
import BoostCMSHeader from './BoostCMSHeader/BoostCMSHeader';
import BoostAddressBook, {
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from './boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import BoostCMSBasicInfoForm from './boostCMSForms/boostCMSBasicInfo/BoostCMSBasicInfoForm';
import BoostCMSAppearanceController from './boostCMSForms/boostCMSAppearance/BoostCMSAppearanceController';
import BoostCMSMediaForm from './boostCMSForms/boostCMSMedia/BoostCMSMediaForm';
import BoostPreview from './BoostPreview/BoostPreview';
import BoostPreviewBody from './BoostPreview/BoostPreviewBody';
import BoostPreviewFooter from './BoostPreview/BoostPreviewFooter';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import BoostLoader from '../boostLoader/BoostLoader';
import BoostCMSConfirmationPrompt from './BoostCMSConfirmationPrompts/BoostCMSConfirmationPrompt';
import BoostCMSTitleForm from './boostCMSForms/boostCMSTitleForm/BoostCMSTitleForm';
import BoostCMSPublish from './boostCMSForms/boostCMSPublish/boostCMSPublish';
import BoostSuccessConfirmation from './BoostSuccessConfirmation/BoostSuccessConfirmation';
import BoostCMSIDAppearanceController from './boostCMSForms/boostCMSAppearance/BoostCMSIDAppearanceController';
import BoostCMSIDCard from '../boost-id-card/BoostIDCard';
import BoostCMSCustomTypeForm from './boostCMSForms/boostCMSTitleForm/BoostCMSCustomTypeForm';
import BoostFrameworkSkillSelector from './boostCMSForms/boostCMSSkills/BoostFrameworkSkillSelector';

import { useAddCredentialToWallet } from '../mutations';

import {
    BoostCMSMediaAttachment,
    BoostCMSState,
    BoostCMSAdmin,
    BoostCMSStepsEnum,
    initialBoostCMSState,
    initialCustomBoostTypesState,
    LCNBoostStatusEnum,
} from '../boost';
import {
    BOOST_CATEGORY_TO_WALLET_ROUTE,
    BoostUserTypeEnum,
    boostCategoryOptions,
} from '../boost-options/boostOptions';
import {
    addAdmin,
    addBoostSomeone,
    removeAdmin,
    getBoostAdmin,
    getBoostCredentialPreview,
    getDefaultAchievementTypeImage,
    getDefaultBoostTitle,
    sendBoostCredential,
    updateBoost,
} from '../boostHelpers';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

import useFirebaseAnalytics from '../../../hooks/useFirebaseAnalytics';
import useWallet from 'learn-card-base/hooks/useWallet';
import {
    BrandingEnum,
    getAchievementTypeFromCustomType,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    resetIonicModalBackground,
    setIonicModalBackground,
    ModalTypes,
    useModal,
    useGetBoostRecipients,
    useGetProfile,
    useGetSearchProfiles,
    usePathQuery,
    useGetBoostPermissions,
    BoostCategoryOptionsEnum,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { useScoutPassStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { VC } from '@learncard/types';

type UpdateBoostCMSProps = {
    boostCategoryType?: BoostCategoryOptionsEnum;
    boostUserType?: BoostUserTypeEnum;
    boostSubCategoryType?: string;
    boostUri?: string;
    otherUserProfileId?: string;
    isModal?: boolean;
    handleCloseModal?: () => void;
    overrideCustomize?: boolean;
    showCustomTypeInput?: boolean;
    // issueMode?: string;
};

const UpdateBoostCMS: React.FC<UpdateBoostCMSProps> = ({
    boostCategoryType,
    boostSubCategoryType,
    showCustomTypeInput,
    boostUserType,
    boostUri,
    otherUserProfileId,
    isModal = false,
    handleCloseModal,
    // issueMode,
}) => {
    const flags = useFlags();
    const history = useHistory();
    const location = useLocation();
    const query = usePathQuery();

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { data: profile } = useGetProfile();
    const _boostCategoryType =
        boostCategoryType || (query.get('boostCategoryType') as BoostCategoryOptionsEnum);
    const _boostSubCategoryType = boostSubCategoryType || query.get('boostSubCategoryType');
    const _boostUserType = boostUserType || query.get('boostUserType');
    const _boostUri = boostUri || query.get('uri');
    const _otherUserProfileId = otherUserProfileId || query.get('otherUserProfileId') || '';
    const issueMode = query.get('issue');
    const _isCustomBoostType = isCustomBoostType(_boostSubCategoryType);

    const { data: boostPermissionData } = useGetBoostPermissions(_boostUri);

    const overrideCustomize = boostPermissionData?.canEdit;

    const [search, setSearch] = useState<string>('');
    const { data: boostAppearanceBadgeList, isLoading: stylePackLoading } =
        useScoutPassStylesPackRegistry();
    const { data: searchResults, isLoading: loading } = useGetSearchProfiles(search ?? '');

    const { data: recipients, isLoading: recipientsLoading } = useGetBoostRecipients(_boostUri);
    const { mutate: addCredentialToWallet } = useAddCredentialToWallet();

    const [state, setState] = useState<BoostCMSState>({
        ...initialBoostCMSState,
        basicInfo: {
            ...initialBoostCMSState.basicInfo,
            type: _boostCategoryType, // main category
            achievementType: _boostSubCategoryType, // sub category type
        },
        appearance: {
            ...initialBoostCMSState.appearance,
            badgeThumbnail: boostCategoryOptions[_boostCategoryType].CategoryImage,
        },
    });
    const [customTypes, setCustomTypes] = useState<any>(initialCustomBoostTypesState);

    const [isEditDisabled, setIsEditDisabled] = useState<boolean>(true);
    const [currentStep, setCurrentStep] = useState<BoostCMSStepsEnum>(BoostCMSStepsEnum.create);

    const [isBoostLoading, setIsBoostLoading] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPublishLoading, setIsPublishLoading] = useState<boolean>(false);
    const [isSaveLoading, setIsSaveLoading] = useState<boolean>(false);
    const [admin, setAdmin] = useState<BoostCMSAdmin[]>([]);

    useEffect(() => {
        const initBoostCMS = async (uri: string) => {
            setIsBoostLoading(true);
            const wallet = await initWallet();

            const boostVC: VC = await wallet?.invoke?.resolveFromLCN(uri);
            const _boostVC = unwrapBoostCredential(boostVC);

            const admin = await getBoostAdmin(wallet, _boostUri);
            const filteredAdmin = admin?.records?.filter(
                record => record.profileId !== profile.profileId
            );
            setAdmin(filteredAdmin);

            // TODO: convert getBoosts() => getBoostByURI
            const allboosts = await wallet?.invoke?.getBoosts();
            const boostWrapper = allboosts.find(b => b.uri === _boostUri);

            // disable editing boost based on boost status
            // DRAFT and PROVISIONAL boosts are editable, LIVE boosts are not
            if (boostWrapper?.status === LCNBoostStatusEnum.draft || boostWrapper?.status === LCNBoostStatusEnum.provisional) {
                setIsEditDisabled(false);
            } else if (boostWrapper?.status === LCNBoostStatusEnum.live) {
                setIsEditDisabled(true);
            }

            const boostVcAttachments = _boostVC?.attachments
                ? boostVC?.attachments?.map((attachment: BoostCMSMediaAttachment) => {
                      return {
                          title: attachment?.title,
                          url: attachment?.url,
                          type: attachment?.type,
                      };
                  })
                : [];

            // Prefer OBv3 alignments if present on the VC; otherwise, derive from legacy skills
            const derivedAlignments = deriveAlignmentsFromVC(_boostVC);

            setState(prevState => {
                return {
                    ...prevState,
                    basicInfo: {
                        ...state?.basicInfo,
                        name: _boostVC?.name,
                        description: _boostVC?.credentialSubject?.achievement?.description,
                        narrative: _boostVC?.credentialSubject?.achievement?.criteria?.narrative,
                        credentialExpires: _boostVC?.expirationDate ? true : false,
                        expirationDate: _boostVC?.expirationDate,
                        issuerName: _boostVC?.boostID?.IDIssuerName,
                    },
                    admins: filteredAdmin,
                    appearance: {
                        ...state?.appearance,
                        badgeThumbnail: _boostVC?.image,
                        backgroundImage: _boostVC?.display?.backgroundImage,
                        backgroundColor: _boostVC?.display?.backgroundColor,

                        fontColor: _boostVC?.boostID?.fontColor,
                        accentColor: _boostVC?.boostID?.accentColor,
                        idBackgroundImage: _boostVC?.boostID?.backgroundImage,
                        dimIdBackgroundImage: _boostVC?.boostID?.dimBackgroundImage,
                        idIssuerThumbnail: _boostVC?.boostID?.issuerThumbnail,
                        showIdIssuerImage: _boostVC?.boostID?.showIssuerThumbnail,
                    },
                    address: {
                        streetAddress: _boostVC?.address?.streetAddress,
                        addressLocality: _boostVC?.address?.addressLocality,
                        addressRegion: _boostVC?.address?.addressRegion,
                        addressCountry: _boostVC?.address?.addressCountry,
                        postalCode: _boostVC?.address?.postalCode,
                        geo: {
                            latitude: _boostVC?.address?.geo?.latitude,
                            longitude: _boostVC?.address?.geo?.longitude,
                        },
                    },
                    mediaAttachments: boostVcAttachments,
                    skills: _boostVC?.skills ?? [],
                    alignments: derivedAlignments,
                };
            });

            setIsBoostLoading(false);
        };

        if (_boostUri) {
            initBoostCMS(_boostUri);
        }
    }, []);

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
                        ...(prevState?.[_boostCategoryType] || []),
                        {
                            title: customTypeTitle,
                            type: _boostSubCategoryType,
                        },
                    ],
                };
            });
        }
    }, []);

    useEffect(() => {
        if (issueMode) {
            setCurrentStep(BoostCMSStepsEnum.issueTo);
        }
    }, [issueMode]);

    const isID = state?.basicInfo?.type === BoostCategoryOptionsEnum.id;
    const isMembership = state?.basicInfo?.type === BoostCategoryOptionsEnum.membership;
    const isMeritBadge = state?.basicInfo?.type === BoostCategoryOptionsEnum.meritBadge;

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
            categoryType === BoostCategoryOptionsEnum.socialBadge
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
        if (!isModal) {
            history.replace(
                `/boost/update?uri=${_boostUri}&boostUserType=${_boostUserType}&boostCategoryType=${categoryType}&boostSubCategoryType=${achievementType}`
            );
        }
    };

    const handleNextStep = () => {
        closePreviewModal();
        if (currentStep === BoostCMSStepsEnum.create) {
            setCurrentStep(BoostCMSStepsEnum.publish);
            logAnalyticsEvent('boostCMS_publish', {
                timestamp: Date.now(),
                action: 'publish',
                boostType: state?.basicInfo?.achievementType,
                category: state?.basicInfo?.type,
            });
        } else if (currentStep === BoostCMSStepsEnum.publish) {
            setCurrentStep(BoostCMSStepsEnum.issueTo);
            logAnalyticsEvent('boostCMS_issue_to', {
                timestamp: Date.now(),
                action: 'issue_to',
                boostType: state?.basicInfo?.achievementType,
                category: state?.basicInfo?.type,
            });
        } else if (currentStep === BoostCMSStepsEnum.issueTo) {
            setCurrentStep(BoostCMSStepsEnum.confirmation);
            logAnalyticsEvent('boostCMS_confirmation', {
                timestamp: Date.now(),
                action: 'confirmation',
                boostType: state?.basicInfo?.achievementType,
                category: state?.basicInfo?.type,
            });
        }
    };

    const handlePrevStep = () => {
        if (currentStep === BoostCMSStepsEnum.publish) {
            setCurrentStep(BoostCMSStepsEnum.create);
        } else if (currentStep === BoostCMSStepsEnum.issueTo) {
            if (issueMode) {
                history.replace(
                    `/boost/update?uri=${_boostUri}&boostUserType=${_boostUserType}&boostCategoryType=${_boostCategoryType}&boostSubCategoryType=${_boostSubCategoryType}`
                );
            }
            handleConfirmationModal();
        }
    };

    const handlePreview = async () => {
        if (isID || isMeritBadge) {
            setIonicModalBackground(state?.appearance?.backgroundImage);
        }

        presentPreviewModal();
    };

    const handleAddAdmin = async () => {
        const adminNeedsAdding = state?.admins?.filter(
            person => !admin?.some(individual => person.profileId === individual.profileId)
        );

        if (adminNeedsAdding.length > 0) {
            const wallet = await initWallet();
            adminNeedsAdding.map(async issuee => {
                const adminForBoost = await addAdmin(wallet, _boostUri, issuee?.profileId);
                return adminForBoost;
            });
        }
    };

    const handleRemoveAdmin = async () => {
        const adminNeedsRemoval = admin.filter(
            person => !state?.admins?.some(individual => person.profileId === individual.profileId)
        );

        if (adminNeedsRemoval.length > 0) {
            const wallet = await initWallet();
            adminNeedsRemoval?.map(async admin => {
                const removedAdmin = await removeAdmin(wallet, _boostUri, admin?.profileId);
                return removedAdmin;
            });
        }
    };

    const handleSaveAndQuit = async (goBack: boolean) => {
        const wallet = await initWallet();

        try {
            setIsSaveLoading(true);
            closePreviewModal();
            handleAddAdmin();
            handleRemoveAdmin();

            const updatedBoost = await updateBoost(
                _boostUri,
                state,
                wallet,
                LCNBoostStatusEnum.draft
            );

            if (updatedBoost) {
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

                if (goBack) {
                    if (!isModal) {
                        history.goBack();
                    }
                    handleCloseModal?.();
                } else {
                    handleCloseModal?.();
                    if (!isModal) {
                        const walletRoute =
                            BOOST_CATEGORY_TO_WALLET_ROUTE[
                                state?.basicInfo
                                    ?.type as keyof typeof BOOST_CATEGORY_TO_WALLET_ROUTE
                            ];
                        history.replace(`/${walletRoute}?managed=true`);
                    }
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

        if (isEditDisabled) {
            handleNextStep();
        } else {
            try {
                setIsPublishLoading(true);
                handleAddAdmin();
                handleRemoveAdmin();
                const updatedBoost = await updateBoost(
                    _boostUri,
                    state,
                    wallet,
                    LCNBoostStatusEnum.live
                );
                setIsPublishLoading(false);
                if (updatedBoost) {
                    logAnalyticsEvent('boostCMS_publish_live', {
                        timestamp: Date.now(),
                        action: 'publish_live',
                        boostType: state?.basicInfo?.achievementType,
                        category: state?.basicInfo?.type,
                    });
                    handleNextStep();
                }
            } catch (e) {
                setIsPublishLoading(false);
                console.log('error::boosting::someone', e);
                presentToast('Error issuing boost', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }
    };

    const handleSaveAndIssue = async () => {
        const wallet = await initWallet();

        try {
            setIsLoading(true);

            if (_boostUri && state?.issueTo.length > 0) {
                const uris = await Promise.all(
                    state?.issueTo.map(async issuee => {
                        // handle self boosting
                        if (issuee?.profileId === profile?.profileId) {
                            const { sentBoost, sentBoostUri } = await sendBoostCredential(
                                wallet,
                                profile?.profileId,
                                _boostUri
                            );

                            // Auto-accept the credential on LCN so it's not stuck in "pending" state
                            await wallet.invoke.acceptCredential(sentBoostUri);

                            //in future allow user to set storage option, eg ceramic or LCN
                            // const uri = await wallet?.store['LearnCard Network'].uploadEncrypted(sentBoost);
                            const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(
                                sentBoost
                            );
                            await addCredentialToWallet({ uri: issuedVcUri });
                            return issuedVcUri;
                        }

                        const issuedVc = await addBoostSomeone(
                            wallet,
                            issuee?.profileId,
                            _boostUri
                        );

                        return issuedVc;
                    })
                );

                if (uris.length > 0) {
                    setIsLoading(false);
                    presentToast('Boost issued successfully', {
                        type: ToastTypeEnum.Success,
                        hasDismissButton: true,
                    });
                    handleNextStep();
                }
            } else {
                setIsSaveLoading(true);

                if (_boostUri) {
                    setIsSaveLoading(false);
                    presentToast('Boost saved successfully', {
                        type: ToastTypeEnum.Success,
                        hasDismissButton: true,
                    });

                    if (isModal) {
                        handleCloseModal?.();
                    }
                    if (!isModal) {
                        const walletRoute =
                            BOOST_CATEGORY_TO_WALLET_ROUTE[
                                state?.basicInfo
                                    ?.type as keyof typeof BOOST_CATEGORY_TO_WALLET_ROUTE
                            ];
                        history.replace(`/${walletRoute}?managed=true`);
                    }
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

    const presentPreviewModal = () => {
        const backgroundImage =
            isID || isMeritBadge ? state?.appearance?.backgroundImage : undefined;
        const previewModalOptions = backgroundImage
            ? { backgroundImage, sectionClassName: 'bg-white' }
            : { sectionClassName: 'bg-white' };

        const categoryTypeEnum =
            (state?.basicInfo?.type as any) || BoostCategoryOptionsEnum.achievement;

        const previewCredential = getBoostCredentialPreview(state) as unknown as VC;

        newPreviewModal(
            <BoostPreview
                credential={previewCredential}
                categoryType={categoryTypeEnum}
                handleCloseModal={() => {
                    closePreviewModal();
                    resetIonicModalBackground();
                }}
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
                            achievementType={state?.basicInfo?.achievementType}
                            boostType={state?.basicInfo?.type}
                            badgeThumbnail={state?.appearance?.badgeThumbnail}
                            badgeCircleCustomClass="w-[170px] h-[170px]"
                            branding={BrandingEnum.scoutPass}
                        />
                    )
                }
                customBodyCardComponent={
                    state?.issueTo?.length > 0 ? (
                        <BoostPreviewBody
                            recipients={state?.issueTo}
                            customBoostPreviewContainerClass="bg-white"
                            customBoostPreviewContainerRowClass="items-center"
                        />
                    ) : (
                        <div />
                    )
                }
                customFooterComponent={
                    <BoostPreviewFooter
                        handleSaveAndQuit={handleSaveAndQuit}
                        isSaveLoading={isSaveLoading}
                        handleSubmit={handlePublishBoost}
                        isLoading={isLoading}
                        showSaveAndQuitButton={
                            currentStep !== BoostCMSStepsEnum.confirmation && !isEditDisabled
                        }
                        showIssueButton={
                            currentStep === BoostCMSStepsEnum.publish && !isEditDisabled
                        }
                        selectedVCType={state?.basicInfo?.type}
                        isEditMode
                    />
                }
                boostPreviewWrapperCustomClass={
                    state?.issueTo?.length > 0 ? '' : 'boost-preview-wrapper'
                }
            />,
            previewModalOptions
        );
    };

    const { newModal: newConfirmModal, closeModal: closeConfirmModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const handleConfirmationModal = () =>
        newConfirmModal(
            <BoostCMSConfirmationPrompt
                state={state}
                handleSaveAndQuit={handleSaveAndQuit}
                handleQuit={handleCloseModal}
                currentStep={currentStep}
                isEditMode={isEditDisabled}
                isSaveLoading={isSaveLoading}
            />,
            { sectionClassName: 'generic-modal show-modal ion-disable-focus-trap !bg-white' }
        );

    let activeBoostCMSStep: null | React.ReactNode = null;

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
                    showTitle={_isCustomBoostType}
                    setState={setState}
                    overrideCustomize={overrideCustomize}
                    disabled={isEditDisabled || !overrideCustomize}
                />

                {_isCustomBoostType &&
                    _boostCategoryType === BoostCategoryOptionsEnum.socialBadge && (
                        <BoostCMSCustomTypeForm
                            state={state}
                            setState={setState}
                            disabled={isEditDisabled || !overrideCustomize}
                        />
                    )}

                {!flags?.disableCmsCustomization && (
                    <BoostCMSMediaForm
                        state={state}
                        setState={setState}
                        disabled={isEditDisabled}
                    />
                )}
                <BoostCMSBasicInfoForm
                    state={state}
                    overrideCustomize={overrideCustomize}
                    setState={setState}
                    disabled={isEditDisabled || !overrideCustomize}
                />

                <BoostFrameworkSkillSelector
                    state={state}
                    setState={setState}
                    reloadStateTrigger={isBoostLoading}
                />

                <BoostAddressBook
                    state={state}
                    setState={setState}
                    mode={BoostAddressBookEditMode.delete}
                    viewMode={BoostAddressBookViewMode.list}
                    search={search}
                    setSearch={setSearch}
                    searchResults={searchResults}
                    isLoading={loading}
                    collectionPropName="admins"
                    showContactOptions={false}
                    title="Assign Admins"
                    hideBoostShareableCode
                />
                {/* <BoostCMSAdvancedSettingsForm
                    state={state}
                    setState={setState}
                    disabled={isEditDisabled}
                />
                <BoostCMSAIMissionForm
                    state={state}
                    setState={setState}
                    disabled={isEditDisabled}
                />
                <BoostCMSAddChatForm state={state} setState={setState} disabled={isEditDisabled} />
                <BoostCMSMemberPrivacyOptions
                    state={state}
                    setState={setState}
                    disabled={isEditDisabled}
                />
                <BoostCMSUserPermissions
                    state={state}
                    setState={setState}
                    disabled={isEditDisabled}
                />
                <BoostCMSAdminsForm state={state} setState={setState} disabled={isEditDisabled} /> */}
            </>
        );
    } else if (currentStep === BoostCMSStepsEnum.publish) {
        activeBoostCMSStep = (
            <BoostCMSPublish
                state={state}
                handlePreview={handlePreview}
                handleSaveAndQuit={handleSaveAndQuit}
                handlePublishBoost={handlePublishBoost}
                showSaveAsDraftButton={!isEditDisabled}
                isSaveLoading={isSaveLoading}
                isPublishLoading={isPublishLoading}
            />
        );
    } else if (currentStep === BoostCMSStepsEnum.issueTo) {
        activeBoostCMSStep = (
            <>
                <BoostAddressBook
                    state={state}
                    setState={setState}
                    mode={BoostAddressBookEditMode.delete}
                    viewMode={BoostAddressBookViewMode.list}
                    search={search}
                    setSearch={setSearch}
                    searchResults={searchResults}
                    isLoading={loading}
                    boostUri={_boostUri}
                    recipients={recipients}
                    recipientsLoading={recipientsLoading}
                />
            </>
        );
    } else if (currentStep === BoostCMSStepsEnum.confirmation) {
        activeBoostCMSStep = (
            <BoostSuccessConfirmation state={state} handlePreview={handlePreview} />
        );
    }

    let loadingText = '';
    if (isBoostLoading) {
        loadingText = 'Loading...';
    } else if (isLoading) {
        loadingText = 'Sending...';
    } else if (isPublishLoading) {
        loadingText = 'Publishing...';
    } else if (isSaveLoading) {
        loadingText = 'Saving...';
    }

    return (
        <IonPage>
            {(isBoostLoading || isLoading || isSaveLoading || isPublishLoading) && (
                <BoostLoader text={loadingText} darkBackground />
            )}

            <BoostCMSHeader
                boostUserType={_boostUserType}
                selectedVCType={state.basicInfo.type}
                currentStep={currentStep}
                handleNextStep={handleNextStep}
                handlePrevStep={handlePrevStep}
                handleConfirmationModal={handleConfirmationModal}
                publishedBoostUri={_boostUri}
                handleSaveAndIssue={handleSaveAndIssue}
                isLoading={isLoading}
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

export default UpdateBoostCMS;
