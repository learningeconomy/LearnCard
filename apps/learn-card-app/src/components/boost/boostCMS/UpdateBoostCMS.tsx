import React, { useEffect, useState } from 'react';
import { deriveAlignmentsFromVC } from '../alignmentHelpers';
import { useHistory, useLocation } from 'react-router-dom';

import { IonCol, IonContent, IonGrid, IonPage, IonRow, useIonModal } from '@ionic/react';
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

import {
    BoostCMSAppearanceDisplayTypeEnum,
    BoostCMSMediaAttachment,
    BoostCMSState,
    BoostCMSAdmin,
    BoostCMSStepsEnum,
    initialBoostCMSState,
    initialCustomBoostTypesState,
    LCNBoostStatusEnum,
} from '../boost';
import { BOOST_CATEGORY_TO_WALLET_ROUTE } from '../boost-options/boostOptions';
import {
    addAdmin,
    addBoostSomeone,
    removeAdmin,
    getBoostAdmin,
    getBoostCredentialPreview,
    getDefaultAchievementTypeImage,
    getDefaultBoostTitle,
    getDefaultDisplayType,
    sendBoostCredential,
    updateBoost,
} from '../boostHelpers';
import {
    getExistingAttachmentsOrEvidence,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import useFirebaseAnalytics from '../../../hooks/useFirebaseAnalytics';
import useWallet from 'learn-card-base/hooks/useWallet';
import {
    getAchievementTypeFromCustomType,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    resetIonicModalBackground,
    setIonicModalBackground,
    useGetBoostRecipients,
    useGetProfile,
    useGetSearchProfiles,
    usePathQuery,
    useModal,
    ModalTypes,
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { useLCAStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import BoostCMSAchievementTypeSelectorButton from './boostCMSForms/boostCMSAppearance/BoostCMSAchievementTypeSelectorButton';
import BoostIDCardCMSMembersForm from './BoostIDCardCMS/BoostIDCardCMSForms/BoostIDCardCMSMembersForm';
import BoostCMSDisplayTypeSelector from './boostCMSForms/boostCMSAppearance/BoostCMSDisplayTypeSelector';
import BoostCMSSkillsAttachmentForm from './boostCMSForms/boostCMSSkills/BoostSkillAttachmentsForm';
import BoostFrameworkSkillSelector from './boostCMSForms/boostCMSSkills/BoostFrameworkSkillSelector';

const UpdateBoostCMS: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const query = usePathQuery();

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const { initWallet, addVCtoWallet } = useWallet();
    const { presentToast } = useToast();
    const { data: profile } = useGetProfile();
    const _boostCategoryType = query.get('boostCategoryType') as BoostCategoryOptionsEnum;
    const _boostSubCategoryType = query.get('boostSubCategoryType');
    const _boostUserType = query.get('boostUserType');
    const _boostUri = query.get('uri')?.replace('localhost:', 'localhost%3A');
    const _otherUserProfileId = query.get('otherUserProfileId') ?? '';
    const issueMode = query.get('issue');

    const [search, setSearch] = useState<string>('');
    const { data: boostAppearanceBadgeList, isLoading: stylePackLoading } =
        useLCAStylesPackRegistry();
    const { data: searchResults, isLoading: loading } = useGetSearchProfiles(search ?? '');

    const { data: recipients, isLoading: recipientsLoading } = useGetBoostRecipients(_boostUri ?? null);

    const [state, setState] = useState<BoostCMSState>({
        ...initialBoostCMSState,
        basicInfo: {
            ...initialBoostCMSState.basicInfo,
            type: _boostCategoryType, // main category
            achievementType: _boostSubCategoryType, // sub category type
        },
        appearance: {
            ...initialBoostCMSState.appearance,
            badgeThumbnail: boostCategoryMetadata[_boostCategoryType].CategoryImage,
            displayType:
                getDefaultDisplayType(_boostCategoryType) || 'certificate',
        },
    });
    const [customTypes, setCustomTypes] = useState<any>(initialCustomBoostTypesState);

    const [isEditDisabled, setIsEditDisabled] = useState<boolean>(false);
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

            const boostVC = await wallet?.invoke?.resolveFromLCN(uri);
            const _boostVC = unwrapBoostCredential(boostVC as any);
            const admin = await getBoostAdmin(wallet, uri);
            const filteredAdmin = admin?.records?.filter(
                record => record.profileId !== profile?.profileId
            );
            setAdmin(filteredAdmin);

            const boostWrapper = await wallet?.invoke?.getBoost(uri);
            // disable editing boost based on boost status
            // DRAFT and PROVISIONAL boosts are editable, LIVE boosts are not
            if (boostWrapper?.status === LCNBoostStatusEnum.draft || boostWrapper?.status === LCNBoostStatusEnum.provisional) {
                setIsEditDisabled(false);
            } else if (boostWrapper?.status === LCNBoostStatusEnum.live) {
                setIsEditDisabled(true);
            }

            const existingAttachmentsOrEvidence = getExistingAttachmentsOrEvidence(
                _boostVC?.attachments,
                _boostVC?.evidence
            );

            const boostVcAttachments = existingAttachmentsOrEvidence
                ? existingAttachmentsOrEvidence?.map((attachment: BoostCMSMediaAttachment) => {
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
                        displayType:
                            _boostVC?.display?.displayType ??
                            getDefaultDisplayType(_boostCategoryType),
                        previewType: _boostVC?.display?.previewType ?? 'default',

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
                    mediaAttachments: [...state?.mediaAttachments, ...boostVcAttachments],
                    skills: [...state.skills, ...(_boostVC?.skills ?? [])],
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
                        ...prevState?.[_boostCategoryType],
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

    const displayType = getDefaultDisplayType(_boostCategoryType);
    const isDisplayID = displayType === BoostCMSAppearanceDisplayTypeEnum.ID;
    const isDisplayBadge = displayType === BoostCMSAppearanceDisplayTypeEnum.Badge;
    const isDisplayCert = displayType === BoostCMSAppearanceDisplayTypeEnum.Certificate;

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
        if (
            categoryType === BoostCategoryOptionsEnum.id ||
            categoryType === BoostCategoryOptionsEnum.membership
        ) {
            // default ID title to selected achievementType
            boostTitle = getDefaultBoostTitle(categoryType, achievementType);
        } else if (
            (_boostCategoryType === BoostCategoryOptionsEnum.id &&
                categoryType !== BoostCategoryOptionsEnum.id) ||
            (_boostCategoryType === BoostCategoryOptionsEnum.membership &&
                categoryType !== BoostCategoryOptionsEnum.membership)
        ) {
            // clear title when switching away from the ID category
            boostTitle = '';
        } else {
            boostTitle = state?.basicInfo?.name;
        }

        setState({
            ...state,
            basicInfo: {
                ...state.basicInfo,
                name: boostTitle,
                type: categoryType,
                achievementType: achievementType,
            },
            appearance: {
                ...state.appearance,
                badgeThumbnail: _badgeThumbnail,
                displayType: getDefaultDisplayType(categoryType),
            },
        });
        history.replace(
            `/boost/update?uri=${_boostUri}&boostUserType=${_boostUserType}&boostCategoryType=${categoryType}&boostSubCategoryType=${achievementType}`
        );
    };

    const handleNextStep = () => {
        dissmissModal();
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
        if (isDisplayCert || isDisplayID) {
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
            dissmissModal();
            closeModal?.();
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
                presentToast(`Boost saved successfully`, {
                    duration: 3000,
                    type: ToastTypeEnum.Success,
                });

                logAnalyticsEvent('boostCMS_publish_draft', {
                    timestamp: Date.now(),
                    action: 'publish_draft',
                    boostType: state?.basicInfo?.achievementType,
                    category: state?.basicInfo?.type,
                });

                if (goBack) {
                    history.goBack();
                } else {
                    history.replace(
                        `/${BOOST_CATEGORY_TO_WALLET_ROUTE?.[state?.basicInfo?.type]}?managed=true`
                    );
                }
            }
        } catch (e) {
            setIsSaveLoading(false);
            console.log('error::savingBoost', e);
            presentToast(`Unable to save boost`, {
                duration: 3000,
                type: ToastTypeEnum.Error,
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
                presentToast(`Error issuing boost`, {
                    duration: 3000,
                    type: ToastTypeEnum.Error,
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
                            //in future allow user to set storage option, eg ceramic or LCN
                            // const uri = await wallet?.store['LearnCard Network'].uploadEncrypted(sentBoost);
                            const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(
                                sentBoost
                            );
                            await addVCtoWallet({ uri: issuedVcUri });
                            return issuedVcUri;
                        }

                        // handle boosting someone else
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
                    presentToast(`Boost issued successfully`, {
                        duration: 3000,
                        type: ToastTypeEnum.Success,
                    });
                    history.goBack();
                }
            } else {
                setIsSaveLoading(true);

                if (_boostUri) {
                    setIsSaveLoading(false);
                    presentToast(`Boost saved successfully`, {
                        duration: 3000,
                        type: ToastTypeEnum.Success,
                    });
                    history.goBack();
                }
            }
        } catch (e) {
            setIsLoading(false);
            console.log('error::boosting::someone', e);
            presentToast(`Error issuing boost`, {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };

    let previewDisplay = null;
    if (isDisplayID) {
        previewDisplay = (
            <BoostCMSIDCard
                state={state}
                setState={setState}
                idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
            />
        );
    } else {
        previewDisplay = (
            <CredentialBadge
                achievementType={state?.basicInfo?.achievementType}
                boostType={state?.basicInfo?.type}
                badgeThumbnail={state?.appearance?.badgeThumbnail}
                badgeCircleCustomClass="w-[170px] h-[170px]"
            />
        );
    }

    const [presentModal, dissmissModal] = useIonModal(BoostPreview, {
        credential: getBoostCredentialPreview(state),
        categoryType: state?.basicInfo?.type,
        handleCloseModal: () => {
            dissmissModal();
        },
        customThumbComponent: previewDisplay,
        customBodyCardComponent:
            state?.issueTo?.length > 0 ? (
                <BoostPreviewBody
                    recipients={state?.issueTo}
                    customBoostPreviewContainerClass="bg-white"
                    customBoostPreviewContainerRowClass="items-center"
                />
            ) : (
                <div />
            ),
        customFooterComponent: (
            <BoostPreviewFooter
                handleSaveAndQuit={handleSaveAndQuit}
                isSaveLoading={isSaveLoading}
                handleSubmit={handlePublishBoost}
                isLoading={isLoading}
                showSaveAndQuitButton={
                    currentStep !== BoostCMSStepsEnum.confirmation && !isEditDisabled
                }
                showIssueButton={currentStep === BoostCMSStepsEnum.publish && !isEditDisabled}
                selectedVCType={state?.basicInfo?.type}
                isEditMode
            />
        ),
        boostPreviewWrapperCustomClass: state?.issueTo?.length > 0 ? '' : 'boost-preview-wrapper',
        skipVerification: true,
        displayType: state?.appearance?.displayType,
        previewType: state?.appearance?.previewType,
    });

    //
    const { newModal, closeModal } = useModal();

    const handleConfirmationModal = () => {
        const buttonText =
            currentStep === BoostCMSStepsEnum.issueTo ? 'Continue Issuing' : 'Continue Editing';

        newModal(
            <BoostCMSConfirmationPrompt
                state={state}
                handleSaveAndQuit={handleSaveAndQuit}
                currentStep={currentStep}
                isEditMode={false}
                isSaveLoading={isSaveLoading}
            />,
            { sectionClassName: '!max-w-[400px]', cancelButtonTextOverride: buttonText },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    let activeBoostCMSStep: null | React.ReactNode = null;
    let appearanceControllerDisplay = null;
    if (isDisplayID) {
        appearanceControllerDisplay = (
            <BoostCMSIDAppearanceController
                state={state}
                setState={setState}
                boostUserType={_boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                customTypes={customTypes}
                setCustomTypes={setCustomTypes}
            />
        );
    } else {
        appearanceControllerDisplay = (
            <BoostCMSAppearanceController
                state={state}
                setState={setState}
                boostUserType={_boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                customTypes={customTypes}
                setCustomTypes={setCustomTypes}
            />
        );
    }

    if (currentStep === BoostCMSStepsEnum.create) {
        activeBoostCMSStep = (
            <>
                {appearanceControllerDisplay}
                <BoostCMSTitleForm state={state} setState={setState} disabled={isEditDisabled} />
                {(isDisplayBadge || isDisplayCert) && (
                    <BoostCMSDisplayTypeSelector state={state} setState={setState} />
                )}
                <BoostCMSAchievementTypeSelectorButton
                    state={state}
                    setState={setState}
                    boostUserType={_boostUserType}
                    customTypes={customTypes}
                    setCustomTypes={setCustomTypes}
                    handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                    disabled={isEditDisabled}
                />
                {/* <BoostCMSSkillsAttachmentForm state={state} setState={setState} /> */}
                <BoostFrameworkSkillSelector
                    state={state}
                    setState={setState}
                    reloadStateTrigger={isBoostLoading}
                />
                <BoostCMSMediaForm state={state} setState={setState} disabled={isEditDisabled} />
                <BoostCMSBasicInfoForm
                    state={state}
                    setState={setState}
                    disabled={isEditDisabled}
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
                {/* {isMembership && <BoostIDCardCMSMembersForm state={state} setState={setState} />} */}
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
        loadingText = 'Loading boost...';
    } else if (isLoading) {
        loadingText = 'Issuing boost...';
    } else if (isPublishLoading) {
        loadingText = 'Publishing boost...';
    } else if (isSaveLoading) {
        loadingText = 'Saving boost...';
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
