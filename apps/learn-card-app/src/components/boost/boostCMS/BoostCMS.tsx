import React, { useEffect, useState, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
    BoostUserTypeEnum,
    lazyWithRetry,
    useToast,
    ToastTypeEnum,
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import { IonCol, IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';

import {
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from './boostCMSForms/boostCMSIssueTo/BoostAddressBook';

const BoostAddressBook = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSIssueTo/BoostAddressBook')
);

const BoostCMSBasicInfoForm = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSBasicInfo/BoostCMSBasicInfoForm')
);
const BoostCMSHeader = lazyWithRetry(() => import('./BoostCMSHeader/BoostCMSHeader'));
const BoostCMSMediaForm = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSMedia/BoostCMSMediaForm')
);
const BoostPreview = lazyWithRetry(() => import('./BoostPreview/BoostPreview'));

const BoostCMSTitleForm = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSTitleForm/BoostCMSTitleForm')
);
const BoostCMSDisplayTypeSelector = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSAppearance/BoostCMSDisplayTypeSelector')
);
const BoostCMSAppearanceController = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSAppearance/BoostCMSAppearanceController')
);

const BoostPreviewFooter = lazyWithRetry(() => import('./BoostPreview/BoostPreviewFooter'));
const CredentialBadge = lazyWithRetry(
    () => import('learn-card-base/components/CredentialBadge/CredentialBadge')
);

// Legacy skill selector (hardcoded skills)
// oxlint-disable-next-line no-unused-vars
const BoostCMSSkillsAttachmentForm = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSSkills/BoostSkillAttachmentsForm')
);
// New framework-based skill selector (Neo4j backend)
const BoostFrameworkSkillSelector = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSSkills/BoostFrameworkSkillSelector')
);

const BoostPreviewBody = lazyWithRetry(() => import('./BoostPreview/BoostPreviewBody'));

const BoostCMSIDCard = lazyWithRetry(() => import('../boost-id-card/BoostIDCard'));
const BoostCMSIDAppearanceController = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSAppearance/BoostCMSIDAppearanceController')
);
const BoostCMSPublish = lazyWithRetry(
    () => import('./boostCMSForms/boostCMSPublish/boostCMSPublish')
);

import BoostCMSMediaDisplayWarning from './boostCMSForms/boostCMSMedia/BoostCMSMediaDisplayWarning';
import BoostLoader from '../boostLoader/BoostLoader';
import BoostCMSConfirmationPrompt from './BoostCMSConfirmationPrompts/BoostCMSConfirmationPrompt';
import BoostSuccessConfirmation from './BoostSuccessConfirmation/BoostSuccessConfirmation';
import RecoveryPrompt from '../../common/RecoveryPrompt';
import useBoostCMSAutosave from '../../../hooks/useBoostCMSAutosave';

import BoostCMSAchievementTypeSelectorButton from './boostCMSForms/boostCMSAppearance/BoostCMSAchievementTypeSelectorButton';

import {
    BoostCMSAppearanceDisplayTypeEnum,
    BoostCMSState,
    BoostCMSStepsEnum,
    initialBoostCMSState,
    initialCustomBoostTypesState,
    LCNBoostStatusEnum,
} from '../boost';
import { BOOST_CATEGORY_TO_WALLET_ROUTE } from '../boost-options/boostOptions';
import {
    addBoostSomeone,
    addAdmin,
    getBoostCredentialPreview,
    getBoostVerificationPreview,
    getDefaultAchievementTypeImage,
    getDefaultBoostTitle,
    getDefaultDisplayType,
    getDefaultIDBackgroundImage,
    sendBoostCredential,
    addFallbackNameToCMSState,
} from '../boostHelpers';
import {
    AIBoostStore,
    CredentialCategoryEnum,
    getAchievementTypeFromCustomType,
    isCustomBoostType,
    ModalTypes,
    replaceUnderscoresWithWhiteSpace,
    useCreateBoost,
    useGetProfile,
    useGetSearchProfiles,
    useModal,
    usePathQuery,
    useDeviceTypeByWidth,
} from 'learn-card-base';

import { useAnalytics, AnalyticsEvents } from '@analytics';
import { useAddCredentialToWallet } from '../mutations';
import useWallet from 'learn-card-base/hooks/useWallet';
import { useLCAStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { useQueryClient } from '@tanstack/react-query';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import BoostCMSMediaOptions from './boostCMSForms/boostCMSMedia/BoostCMSMediaOptions';
import { extractSkillIdsFromAlignments } from '../alignmentHelpers';

const FamilyCMS = lazyWithRetry(() => import('../../familyCMS/FamilyCMS'));

interface BoostCMSProps {
    boostDetails?: {
        title: string;
        description: string;
        category: string;
        categoryEnum: string;
        type: string;
        imageUrl: string;
    };
    handleCloseModal?: () => void;
    handleEdit?: () => void;
    handleSend?: () => Promise<void>;
    wallet?: BespokeLearnCard | null;
    boostCMSState?: BoostCMSState;
    profileId?: string;
}

const BoostCMS: React.FC<BoostCMSProps> = ({
    boostDetails,
    // oxlint-disable-next-line no-unused-vars
    handleCloseModal,
    // oxlint-disable-next-line no-unused-vars
    handleEdit,
    // oxlint-disable-next-line no-unused-vars
    handleSend,
    wallet: propWallet,
    boostCMSState: propBoostCMSState,
    // oxlint-disable-next-line no-unused-vars
    profileId: propProfileId,
}) => {
    const history = useHistory();
    const location = useLocation();
    const query = usePathQuery();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const queryClient = useQueryClient();
    const { isDesktop } = useDeviceTypeByWidth();

    const { track } = useAnalytics();

    const { newModal, closeModal } = useModal();
    const { mutateAsync: createBoost } = useCreateBoost();
    const { mutate: addCredentialToWallet } = useAddCredentialToWallet();

    const [search, setSearch] = useState<string>('');
    const { data: boostAppearanceBadgeList, isLoading: stylePackLoading } =
        useLCAStylesPackRegistry();
    const { data: searchResults, isLoading: loading } = useGetSearchProfiles(search ?? '');

    const _boostCategoryType = query.get('boostCategoryType') as BoostCategoryOptionsEnum;
    const _boostSubCategoryType = query.get('boostSubCategoryType');
    const _boostUserType =
        (query.get('boostUserType') as BoostUserTypeEnum) || BoostUserTypeEnum.someone;
    const _otherUserProfileId = query.get('otherUserProfileId') ?? '';
    const _isRecovering = query.get('recovering') === 'true';

    const { data: profile } = useGetProfile();
    const aiBoost = AIBoostStore.useStore();

    const [state, setState] = useState<BoostCMSState>(() => {
        if (propBoostCMSState) {
            return propBoostCMSState;
        }
        return {
            ...initialBoostCMSState,
            basicInfo: {
                ...initialBoostCMSState.basicInfo,
                name:
                    boostDetails?.title ||
                    aiBoost?.title ||
                    getDefaultBoostTitle(_boostCategoryType, _boostSubCategoryType),
                description: boostDetails?.description || aiBoost?.description || '',
                type:
                    (boostDetails?.categoryEnum as BoostCategoryOptionsEnum) || _boostCategoryType,
                achievementType: boostDetails?.type || _boostSubCategoryType,
            },
            appearance: {
                ...initialBoostCMSState.appearance,
                badgeThumbnail:
                    boostDetails?.imageUrl ||
                    aiBoost?.imageUrl ||
                    getDefaultAchievementTypeImage(
                        _boostCategoryType,
                        _boostSubCategoryType,
                        boostCategoryMetadata[_boostCategoryType].CategoryImage,
                        boostAppearanceBadgeList
                    ),
                backgroundImage: aiBoost?.backgroundImageUrl || '',
                displayType: getDefaultDisplayType(_boostCategoryType),
            },
        };
    });

    const [customTypes, setCustomTypes] = useState<any>(initialCustomBoostTypesState);
    const [currentStep, setCurrentStep] = useState<BoostCMSStepsEnum>(BoostCMSStepsEnum.create);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPublishLoading, setIsPublishLoading] = useState<boolean>(false);
    const [isSaveLoading, setIsSaveLoading] = useState<boolean>(false);
    const [publishedBoostUri, setPublishedBoostUri] = useState<string | null>(null);
    const [wallet, setWallet] = useState<BespokeLearnCard | null>(propWallet || null);
    const [displayType, setDisplayType] = useState<BoostCMSAppearanceDisplayTypeEnum>(
        state.appearance?.displayType || BoostCMSAppearanceDisplayTypeEnum.Certificate
    );
    const isIDDisplay = displayType === BoostCMSAppearanceDisplayTypeEnum.ID;
    const isBadgeDisplay = displayType === BoostCMSAppearanceDisplayTypeEnum.Badge;
    const isCertDisplay = displayType === BoostCMSAppearanceDisplayTypeEnum.Certificate;
    const isAwardDisplay = displayType === BoostCMSAppearanceDisplayTypeEnum.Award;
    const isMediaDisplay = displayType === BoostCMSAppearanceDisplayTypeEnum.Media;
    const issueToLength = state?.issueTo?.length;

    // Autosave hook - saves progress to localStorage and can recover from interruptions
    const {
        hasRecoveredState,
        recoveredState,
        recoveredBoostCategory,
        clearRecoveredState,
        saveToLocal,
        clearLocalSave,
        isAutosaving,
        hasUnsavedChanges,
    } = useBoostCMSAutosave({
        enabled: !propBoostCMSState, // Disable autosave if editing an existing boost
        boostCategoryType: _boostCategoryType,
        boostSubCategoryType: _boostSubCategoryType,
    });

    // Track if recovery prompt has been shown
    const hasShownRecoveryRef = useRef(false);
    const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track intentional navigation to bypass the navigation blocker
    const isIntentionalNavigationRef = useRef(false);
    // Track when a modal operation (like saving category/type) is in progress
    // This prevents the navigation blocker from showing during modal closes
    const isModalOperationInProgressRef = useRef(false);

    // Refs to stabilize modal functions for the navigation blocker effect
    // This prevents the effect from re-running when modals are opened/closed
    const newModalRef = useRef(newModal);
    const closeModalRef = useRef(closeModal);
    useEffect(() => {
        newModalRef.current = newModal;
        closeModalRef.current = closeModal;
    }, [newModal, closeModal]);

    // Show recovery prompt if we have recovered state
    // If _isRecovering is true (from URL param), auto-recover without showing modal
    // Delay slightly to avoid race conditions with other mount effects that might call closeModal
    useEffect(() => {
        if (hasRecoveredState && recoveredState && !hasShownRecoveryRef.current) {
            hasShownRecoveryRef.current = true;

            // Clear any existing timeout
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }

            const handleRecover = () => {
                setState(recoveredState);
                setDisplayType(
                    recoveredState.appearance?.displayType ||
                        BoostCMSAppearanceDisplayTypeEnum.Certificate
                );
                // Clear the old recovered state from localStorage so new changes will be saved fresh
                clearRecoveredState();
            };

            // If coming from the early recovery prompt (recovering=true in URL), auto-recover
            if (_isRecovering) {
                handleRecover();
                return;
            }

            // Delay showing the modal to let other mount effects settle
            recoveryTimeoutRef.current = setTimeout(() => {
                const handleDiscard = () => {
                    clearRecoveredState(true); // Clear localStorage on discard
                    closeModal();
                };

                newModal(
                    <RecoveryPrompt
                        itemName={recoveredState?.basicInfo?.name || ''}
                        itemType="boost"
                        onRecover={() => {
                            handleRecover();
                            closeModal();
                        }}
                        onDiscard={handleDiscard}
                    />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );
            }, 300);
        }

        return () => {
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }
        };
    }, [
        hasRecoveredState,
        recoveredState,
        clearRecoveredState,
        newModal,
        closeModal,
        _isRecovering,
    ]);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (
            !propBoostCMSState &&
            !publishedBoostUri &&
            (state.basicInfo.name || state.basicInfo.description)
        ) {
            saveToLocal(state);
        }
    }, [state, saveToLocal, propBoostCMSState, publishedBoostUri]);

    // Block navigation when there are unsaved changes and show warning modal
    useEffect(() => {
        if (!hasUnsavedChanges || publishedBoostUri) return;

        const unblock = history.block((location, action) => {
            // Skip blocking if this is an intentional navigation (Save & Quit, Quit Without Saving)
            if (isIntentionalNavigationRef.current) {
                isIntentionalNavigationRef.current = false;
                return;
            }

            // Skip blocking if a modal operation is in progress (e.g., saving category/type from a nested modal)
            if (isModalOperationInProgressRef.current) {
                isModalOperationInProgressRef.current = false;
                return;
            }

            newModalRef.current(
                <div className="pt-[36px] pb-[16px]">
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="w-full flex flex-col items-center justify-center px-4 text-grayscale-900">
                            <h6 className="font-semibold text-black font-poppins text-xl mb-2">
                                Leave This Page?
                            </h6>
                            <p className="text-center text-grayscale-600 font-poppins text-sm mb-4">
                                You have unsaved changes. Your progress will be saved locally and
                                you can continue editing later.
                            </p>
                            <button
                                onClick={() => {
                                    closeModal();
                                    unblock();
                                    history.push(location);
                                }}
                                className="flex items-center justify-center text-white rounded-full px-[64px] py-[10px] bg-rose-600 font-poppins font-medium text-xl w-full shadow-lg"
                            >
                                Leave Page
                            </button>
                            <button
                                onClick={() => closeModalRef.current()}
                                className="flex items-center justify-center text-white rounded-full px-[50px] py-[10px] bg-grayscale-900 font-poppins font-medium text-xl w-full shadow-lg mt-4"
                            >
                                Stay & Continue Editing
                            </button>
                        </div>
                    </div>
                </div>,
                { sectionClassName: '!max-w-[400px]' },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );

            // Return false to block navigation
            return false;
        });

        return () => {
            unblock();
        };
    }, [hasUnsavedChanges, publishedBoostUri, history]);

    useEffect(() => {
        const initializeWallet = async () => {
            if (!wallet) {
                const initializedWallet = await initWallet();
                setWallet(initializedWallet);
            }
        };
        initializeWallet();
    }, [initWallet, wallet]);

    useEffect(() => {
        const loadOtherUser = async () => {
            if (!wallet) return;

            if (_otherUserProfileId) {
                const otherUser = await wallet.invoke.getProfile(_otherUserProfileId);

                const userAlreadyExists = state?.issueTo.find(
                    issuee => issuee.profileId === otherUser.profileId
                );

                if (!userAlreadyExists && otherUser) {
                    setState(prevState => ({
                        ...prevState,
                        issueTo: [...prevState.issueTo, otherUser],
                    }));
                }
            }
        };

        loadOtherUser();
    }, [location.search, _otherUserProfileId, wallet]);

    useEffect(() => {
        // Guard clause: if category or subcategory is null, don't update the state
        if (_boostCategoryType === null || _boostSubCategoryType === null) {
            return;
        }

        if (isCustomBoostType(_boostSubCategoryType)) {
            const customTypeTitle = replaceUnderscoresWithWhiteSpace(
                getAchievementTypeFromCustomType(_boostSubCategoryType)
            );

            setCustomTypes(prevState => ({
                ...prevState,
                [_boostCategoryType]: [
                    ...(prevState[_boostCategoryType] ?? []),
                    {
                        title: customTypeTitle,
                        type: _boostSubCategoryType,
                    },
                ],
            }));
        }

        // Only update the badgeThumbnail if it's not already set or if the category/subcategory has changed
        setState(prevState => {
            const currentThumbnail = prevState.appearance.badgeThumbnail;
            const newThumbnail = getDefaultAchievementTypeImage(
                _boostCategoryType,
                _boostSubCategoryType,
                boostCategoryMetadata[_boostCategoryType].CategoryImage,
                boostAppearanceBadgeList
            );

            // Only update if the new thumbnail is different from the current one
            if (currentThumbnail !== newThumbnail && currentThumbnail !== aiBoost?.imageUrl) {
                return {
                    ...prevState,
                    appearance: {
                        ...prevState.appearance,
                        badgeThumbnail: newThumbnail,
                    },
                };
            }

            // If the thumbnails are the same, return the previous state without changes
            return prevState;
        });
    }, [stylePackLoading, _boostCategoryType, _boostSubCategoryType, boostAppearanceBadgeList]);

    // set AI generate boost state
    useEffect(() => {
        if (aiBoost?.title) {
            setState(prevState => {
                return {
                    ...prevState,
                    basicInfo: {
                        ...prevState.basicInfo,
                        name: aiBoost?.title,
                        description: aiBoost?.description,
                        narrative: aiBoost?.narrative,
                    },
                    appearance: {
                        ...prevState.appearance,
                        badgeThumbnail: aiBoost?.imageUrl || prevState.appearance.badgeThumbnail,
                    },
                    skills: aiBoost?.skills || prevState.skills,
                };
            });
        }
    }, [aiBoost]);

    const handleCategoryAndTypeChange = (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => {
        // Set flag to prevent navigation blocker from showing during this modal operation
        isModalOperationInProgressRef.current = true;

        const _badgeThumbnail =
            aiBoost?.imageUrl ||
            getDefaultAchievementTypeImage(
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
            boostTitle = getDefaultBoostTitle(categoryType, achievementType);
        } else if (
            (state.basicInfo.type === BoostCategoryOptionsEnum.id &&
                categoryType !== BoostCategoryOptionsEnum.id) ||
            (state.basicInfo.type === BoostCategoryOptionsEnum.membership &&
                categoryType !== BoostCategoryOptionsEnum.membership)
        ) {
            boostTitle = '';
        } else {
            boostTitle = state?.basicInfo?.name;
        }

        let newDisplayType = BoostCMSAppearanceDisplayTypeEnum.Certificate;
        if (categoryType === BoostCategoryOptionsEnum.id) {
            newDisplayType = BoostCMSAppearanceDisplayTypeEnum.ID;
        } else if (categoryType === BoostCategoryOptionsEnum.course) {
            newDisplayType = BoostCMSAppearanceDisplayTypeEnum.Course;
        } else if (categoryType === BoostCategoryOptionsEnum.accomplishment) {
            newDisplayType = BoostCMSAppearanceDisplayTypeEnum.Media;
        }

        setState(prevState => {
            const newState = {
                ...prevState,
                basicInfo: {
                    ...prevState.basicInfo,
                    name: boostTitle,
                    type: categoryType,
                    achievementType: achievementType,
                },
                appearance: {
                    ...prevState.appearance,
                    badgeThumbnail: _badgeThumbnail,
                    idBackgroundImage: getDefaultIDBackgroundImage(categoryType),
                    displayType: newDisplayType,
                },
            };
            return newState;
        });

        setDisplayType(newDisplayType);

        let link = `/boost?boostUserType=${_boostUserType}&boostCategoryType=${categoryType}&boostSubCategoryType=${achievementType}`;
        if (_otherUserProfileId) {
            link = `${link}&otherUserProfileId=${_otherUserProfileId}`;
        }
        history.replace(link);
    };

    const clearAIBoostStore = () => {
        AIBoostStore.set.title('');
        AIBoostStore.set.description('');
        AIBoostStore.set.narrative('');
        AIBoostStore.set.category(CredentialCategoryEnum.achievement);
        AIBoostStore.set.categoryEnum(CredentialCategoryEnum.achievement);
        AIBoostStore.set.type('');
        AIBoostStore.set.imageUrl('');
        AIBoostStore.set.backgroundImageUrl('');
        AIBoostStore.set.skills([]);
    };

    // Add this effect to clear the store when the component unmounts
    useEffect(() => {
        return () => {
            clearAIBoostStore();
        };
    }, []);

    if (_boostCategoryType === BoostCategoryOptionsEnum.family) {
        return <FamilyCMS handleCloseModal={() => history.goBack()} />;
    }

    const handleNextStep = () => {
        if (currentStep === BoostCMSStepsEnum.create) {
            if (isMediaDisplay && state?.mediaAttachments?.length === 0) {
                newModal(
                    <BoostCMSMediaDisplayWarning handleShowMediaOptions={handleShowMediaOptions} />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );
                return;
            }

            closeModal();
            setCurrentStep(BoostCMSStepsEnum.publish);
            track(AnalyticsEvents.BOOST_CMS_PUBLISH, {
                timestamp: Date.now(),
                action: 'publish',
                boostType: state?.basicInfo?.achievementType ?? undefined,
                category: state?.basicInfo?.type,
            });
        } else if (currentStep === BoostCMSStepsEnum.publish) {
            closeModal();
            setCurrentStep(BoostCMSStepsEnum.issueTo);
            track(AnalyticsEvents.BOOST_CMS_ISSUE_TO, {
                timestamp: Date.now(),
                action: 'issue_to',
                boostType: state?.basicInfo?.achievementType ?? undefined,
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
        newModal(
            <BoostPreview
                skipVerification
                close
                credential={getBoostCredentialPreview(state)}
                categoryType={state?.basicInfo?.type}
                verificationItems={getBoostVerificationPreview(state)}
                customThumbComponent={previewDisplay}
                customBodyCardComponent={
                    issueToLength > 0 ? (
                        <BoostPreviewBody
                            recipients={state?.issueTo}
                            customBoostPreviewContainerClass="bg-white"
                            customBoostPreviewContainerRowClass="items-center"
                        />
                    ) : undefined
                }
                issuerOverride={profile}
                handleCloseModal={() => closeModal?.()}
                customFooterComponent={
                    <BoostPreviewFooter
                        handleSaveAndQuit={handleSaveAndQuit}
                        isSaveLoading={isSaveLoading}
                        handleSubmit={handlePublishBoost}
                        isLoading={isLoading}
                        showIssueButton={currentStep === BoostCMSStepsEnum.publish}
                        showSaveAndQuitButton={currentStep !== BoostCMSStepsEnum.confirmation}
                        selectedVCType={state?.basicInfo?.type}
                    />
                }
                boostPreviewWrapperCustomClass={issueToLength > 0 ? '' : 'boost-preview-wrapper'}
                displayType={state?.appearance?.displayType}
                previewType={state?.appearance?.previewType}
            />,
            {
                backgroundImage:
                    isCertDisplay || isIDDisplay || isAwardDisplay
                        ? state?.appearance?.backgroundImage
                        : undefined,
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const handleAddAdmin = async (wallet: BespokeLearnCard, boostUri: string) => {
        await Promise.all(
            state?.admins.map(async issuee => {
                await addAdmin(wallet, boostUri, issuee?.profileId);
            })
        );
    };

    // oxlint-disable-next-line no-unused-vars
    const handleSaveAndQuit = async (goBack: boolean = false) => {
        if (!wallet) {
            presentToast(`Wallet is not initialized`, {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
            return;
        }

        try {
            setIsSaveLoading(true);
            closeModal();

            const skillIds = extractSkillIdsFromAlignments(state?.alignments ?? []);

            const { boostUri } = await createBoost({
                state: addFallbackNameToCMSState(state),
                status: LCNBoostStatusEnum.draft,
                skillIds,
            });

            queryClient.invalidateQueries({ queryKey: ['boosts', state.basicInfo.type] });

            if (boostUri && state?.admins?.length > 0) {
                await handleAddAdmin(wallet, boostUri);
            }

            if (boostUri) {
                // Clear autosave since we successfully saved to server
                clearLocalSave();

                setIsSaveLoading(false);
                presentToast(`Boost saved successfully`, {
                    duration: 3000,
                    type: ToastTypeEnum.Success,
                });

                track(AnalyticsEvents.BOOST_CMS_PUBLISH, {
                    timestamp: Date.now(),
                    action: 'publish_draft',
                    boostType: state?.basicInfo?.achievementType ?? undefined,
                    category: state?.basicInfo?.type,
                });

                // Mark as intentional navigation to bypass the blocker
                isIntentionalNavigationRef.current = true;
                history.replace(
                    `/${BOOST_CATEGORY_TO_WALLET_ROUTE[state?.basicInfo?.type]}?managed=true`
                );
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
        if (!wallet) {
            presentToast(`Wallet is not initialized`, {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
            return;
        }

        try {
            setIsPublishLoading(true);
            closeModal();

            const skillIds = extractSkillIdsFromAlignments(state?.alignments ?? []);

            const { boostUri } = await createBoost({
                state: addFallbackNameToCMSState(state),
                status: LCNBoostStatusEnum.live,
                skillIds,
            });

            setIsPublishLoading(false);
            if (boostUri) {
                track(AnalyticsEvents.BOOST_CMS_PUBLISH, {
                    timestamp: Date.now(),
                    action: 'publish_live',
                    boostType: state?.basicInfo?.achievementType ?? undefined,
                    category: state?.basicInfo?.type,
                });

                setPublishedBoostUri(boostUri);

                if (state?.admins?.length > 0) {
                    await handleAddAdmin(wallet, boostUri);
                }

                if (_otherUserProfileId && state.issueTo?.length > 0) {
                    // if we're issuing to a specific person, issue immediately after publishing
                    await handleSaveAndIssue(boostUri);
                } else {
                    handleNextStep();
                }
            }
        } catch (e) {
            setIsPublishLoading(false);
            console.log('error::boosting::someone', e);
            presentToast(`Error issuing boost`, {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };

    const handleSaveAndIssue = async (boostUri?: string | null) => {
        if (!wallet) {
            presentToast(`Wallet is not initialized`, {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
            return;
        }

        try {
            setIsLoading(true);
            if (boostUri && issueToLength > 0) {
                const uris = await Promise.all(
                    state?.issueTo.map(async issuee => {
                        // handle self boosting
                        if (issuee?.profileId === profile?.profileId) {
                            console.log('boostUri', boostUri);
                            console.log('boost', await wallet.invoke.getBoost(boostUri));
                            // oxlint-disable-next-line no-unused-vars
                            const { sentBoost, sentBoostUri } = await sendBoostCredential(
                                wallet,
                                profile?.profileId,
                                boostUri
                            );
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

                if (uris.length > 0) {
                    setIsLoading(false);
                    clearLocalSave();
                    presentToast(`Boost issued successfully`, {
                        duration: 3000,
                        type: ToastTypeEnum.Success,
                    });
                    history.goBack();
                }
            } else {
                setIsSaveLoading(true);

                if (boostUri) {
                    setIsSaveLoading(false);
                    clearLocalSave();
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
    if (isIDDisplay) {
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
                clearLocalSave={clearLocalSave}
                onIntentionalNavigation={() => {
                    isIntentionalNavigationRef.current = true;
                }}
            />,
            { sectionClassName: '!max-w-[400px]', cancelButtonTextOverride: buttonText },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const handleShowMediaOptions = () => {
        newModal(
            <BoostCMSMediaOptions
                state={state}
                setState={setState}
                showCloseButton={isDesktop}
                title={
                    <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                        Media Attachment
                    </p>
                }
            />,
            { sectionClassName: '!max-w-[500px]' }
        );
    };

    let activeBoostCMSStep = null;
    let appearanceControllerDisplay = null;
    if (_boostUserType) {
        if (isIDDisplay) {
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
    }

    if (currentStep === BoostCMSStepsEnum.create) {
        activeBoostCMSStep = (
            <>
                {appearanceControllerDisplay}
                <BoostCMSTitleForm state={state} setState={setState} />
                {(isBadgeDisplay || isCertDisplay || isAwardDisplay || isMediaDisplay) && (
                    <BoostCMSDisplayTypeSelector
                        state={state}
                        setState={setState}
                        displayType={displayType}
                        setDisplayType={setDisplayType}
                    />
                )}
                <BoostCMSAchievementTypeSelectorButton
                    state={state}
                    setState={setState}
                    boostUserType={_boostUserType}
                    customTypes={customTypes}
                    setCustomTypes={setCustomTypes}
                    handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                />
                {/* <BoostCMSSkillsAttachmentForm state={state} setState={setState} /> */}
                {/* Framework-based skill selector (new) */}
                <BoostFrameworkSkillSelector state={state} setState={setState} />
                <BoostCMSMediaForm state={state} setState={setState} />
                <BoostCMSBasicInfoForm state={state} setState={setState} />
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
        loadingText = 'Issuing boost...';
    } else if (isPublishLoading) {
        loadingText = 'Publishing boost...';
    } else if (isSaveLoading) {
        loadingText = 'Saving boost...';
    } else if (isAutosaving) {
        loadingText = 'Auto-saving...';
    } else if (stylePackLoading) {
        loadingText = 'Loading boost...';
    }

    return (
        <IonPage>
            {(isLoading ||
                isSaveLoading ||
                isPublishLoading ||
                isAutosaving ||
                stylePackLoading) && <BoostLoader text={loadingText} darkBackground />}

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
