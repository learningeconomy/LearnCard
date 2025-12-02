import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from 'lodash';

import { useHistory } from 'react-router-dom';
import useJoinLCNetworkModal from '../network-prompts/hooks/useJoinLCNetworkModal';
import { useQueryClient } from '@tanstack/react-query';
import { useAddCredentialToWallet } from '../boost/mutations';

import { IonPage } from '@ionic/react';
import FamilyCMSHeader from './FamilyCMSHeader/FamilyCMSHeader';
import FamilyCrest from './FamilyCrest/FamilyCrest';
import FamilyCMSContentForm from './FamilyCMSContentForm/FamilyCMSContentForm';
import FamilyCMSLayout from './FamilyCMSLayout';
import FamilyCMSFooter from './FamilyCMSFooter/FamilyCMSFooter';
import FamilyCMSMemberList from './FamilyCMSMembersList/FamilyCMSMembersList';
import FamilyCMSMemberTitlesToggle from './FamilyCMSMemberTitlesForm/FamilyCMSMemberTitlesToggle/FamilyCMSMemberTitlesToggle';
import FamilyCMSAppearanceForm from './FamilyCMSAppearanceForm/FamilyCMSAppearanceForm';
import BoostLoader from '../boost/boostLoader/BoostLoader';
import FamilyCMSTabs, { FamilyCMSTabsEnum } from './FamilyCMSTabs/FamilyCMSTabs';
import FamilyPin from './FamilyBoostPreview/FamilyPin/FamilyPin';

import {
    FamilyChildAccount,
    FamilyCMSEditorModeEnum,
    FamilyCMSState,
    initializeFamilyState,
    mapCredentialIntoState,
} from './familyCMSState';

import {
    BoostCategoryOptionsEnum,
    getNotificationsEndpoint,
    switchedProfileStore,
    useCreateBoost,
    useCreatePin,
    useCurrentUser,
    useEditBoostMeta,
    useGetCurrentLCNUser,
    useGetDidHasPin,
    useWallet,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_LEARNCARD_ID_WALLPAPER,
    DEFAULT_LEARNCARD_WALLPAPER,
} from '../learncardID-CMS/learncard-cms.helpers';

import { addAdmin, addBoostSomeone, sendBoostCredential } from '../boost/boostHelpers';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { LCNBoostStatusEnum } from '../boost/boost';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { VC } from '@learncard/types';

const StateValidator = z.object({
    name: z.string().min(1, 'Name is required!'),
    description: z.string().min(1, 'Description is required!'),
});

type FamilyCMSProps = {
    credential?: VC;
    editorMode?: FamilyCMSEditorModeEnum;
    handleCloseModal?: () => void;
    onFamilyCreationSuccess?: () => void;
    editBoostUri?: string;
};

export const FamilyCMS: React.FC<FamilyCMSProps> = ({
    credential,
    editorMode = FamilyCMSEditorModeEnum.create,
    handleCloseModal = () => {},
    onFamilyCreationSuccess,
    editBoostUri,
}) => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const currentUser = useCurrentUser();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal(() => {
        // close FamilyCMS if they decline to join the LCN
        //   setTimeout because calling it regularly doesn't work (there's timeout shenanigans in closeModal)
        setTimeout(handleCloseModal, 301);
    });

    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const { data: hasPin, isLoading: hasPinLoading } = useGetDidHasPin();
    const { mutateAsync: createBoost } = useCreateBoost();
    const { mutateAsync: editBoost } = useEditBoostMeta();
    const { mutateAsync: addCredentialToWallet } = useAddCredentialToWallet();
    const { mutateAsync: createPin } = useCreatePin();

    const [state, setState] = useState<FamilyCMSState>(
        editorMode === FamilyCMSEditorModeEnum.create
            ? initializeFamilyState(currentUser)
            : mapCredentialIntoState(credential)
    );
    const [activeTab, setActiveTab] = useState<FamilyCMSTabsEnum>(FamilyCMSTabsEnum.content);
    const [issuedVCUri, setIssuedVCUri] = useState<string>('');

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [pinError, setPinError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPublishLoading, setIsPublishLoading] = useState<boolean>(false);
    const [isSaveLoading, setIsSaveLoading] = useState<boolean>(false);

    useEffect(() => {
        if (currentLCNUser === null && !currentLCNUserLoading) {
            // Join Network prompt if they're not part of the LCN network
            handlePresentJoinNetworkModal();
        }
    }, [currentLCNUser, currentLCNUserLoading]);

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            name: state?.basicInfo.name,
            description: state?.basicInfo?.description,
        });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const validatePin = () => {
        if (editorMode === FamilyCMSEditorModeEnum.create && state?.pin?.length !== 5 && !hasPin) {
            setPinError('Pin is Required.');
            return false;
        }

        return true;
    };

    const handleIssueBoost = async (
        wallet: BespokeLearnCard,
        boostUri: string,
        profileIDs: string[]
    ) => {
        try {
            const uris = await Promise.all(
                profileIDs.map(async profileId => {
                    // handle self boosting
                    if (profileId === currentLCNUser?.profileId) {
                        const { sentBoost, sentBoostUri } = await sendBoostCredential(
                            wallet,
                            profileId,
                            boostUri
                        );

                        const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(
                            sentBoost
                        );

                        setIssuedVCUri(issuedVCUri);

                        await addCredentialToWallet({ uri: issuedVcUri });
                        return issuedVcUri;
                    }
                    // handle boosting someone else
                    const issuedVc = await addBoostSomeone(wallet, profileId, boostUri);
                    return issuedVc;
                })
            );

            return uris;
        } catch (e) {
            setIsLoading(false);
            console.error('handleIssueBoost::error', e);
        }
    };

    const handleAddAdmins = async (
        wallet: BespokeLearnCard,
        boostUri: string,
        admins: string[]
    ) => {
        try {
            if (admins?.length > 0) {
                await Promise.all(
                    admins?.map(async admin => {
                        if (admin === currentLCNUser?.profileId) {
                            // the creator is already an admin
                            return;
                        }
                        const adminForBoost = await addAdmin(wallet, boostUri, admin);
                        return adminForBoost;
                    })
                );
            }
        } catch (e) {
            console.error('handleAddAdmins::error', e);
        }
    };

    const handleCreateChildrenProfiles = async (
        wallet: BespokeLearnCard,
        boostUri: string,
        dependents: FamilyChildAccount[]
    ) => {
        try {
            if (dependents?.length > 0) {
                await Promise.all(
                    dependents?.map(async dependent => {
                        const managerDid = await wallet.invoke.createChildProfileManager(boostUri, {
                            displayName: dependent?.name,
                            bio: dependent?.shortBio,
                            image: dependent?.image,
                        });

                        const managerLc = await getBespokeLearnCard(
                            currentUser?.privateKey ?? '',
                            managerDid
                        );

                        const learnCardDisplayStyles = dependent?.learnCardID;

                        const childDid = await managerLc.invoke.createManagedProfile({
                            profileId: dependent.profileId!, // uuid
                            displayName: '',
                            bio: '',
                            shortBio: '',
                            notificationsWebhook: getNotificationsEndpoint(),
                            display: {
                                // container styles
                                backgroundColor:
                                    learnCardDisplayStyles?.backgroundColor ?? DEFAULT_COLOR_LIGHT,
                                backgroundImage:
                                    learnCardDisplayStyles?.backgroundImage ??
                                    DEFAULT_LEARNCARD_WALLPAPER,
                                fadeBackgroundImage:
                                    learnCardDisplayStyles?.fadeBackgroundImage ?? false,
                                repeatBackgroundImage:
                                    learnCardDisplayStyles?.repeatBackgroundImage ?? false,

                                // id styles
                                fontColor: learnCardDisplayStyles?.fontColor ?? DEFAULT_COLOR_LIGHT,
                                accentColor: learnCardDisplayStyles?.accentColor ?? '#ffffff',
                                accentFontColor: learnCardDisplayStyles?.accentFontColor ?? '',
                                idBackgroundImage:
                                    learnCardDisplayStyles?.idBackgroundImage ??
                                    DEFAULT_LEARNCARD_ID_WALLPAPER,
                                fadeIdBackgroundImage:
                                    learnCardDisplayStyles?.dimIdBackgroundImage ?? true,
                                idBackgroundColor:
                                    learnCardDisplayStyles?.idBackgroundColor ?? '#2DD4BF',
                                repeatIdBackgroundImage:
                                    learnCardDisplayStyles?.repeatIdBackgroundImage ?? false,
                            },
                        });

                        const childLc = await getBespokeLearnCard(
                            currentUser?.privateKey ?? '',
                            childDid
                        );

                        // handle boosting someone else
                        const { sentBoostUri } = await sendBoostCredential(
                            wallet,
                            dependent?.profileId!,
                            boostUri,
                            { skipNotification: true }
                        );

                        await childLc.index['LearnCloud'].add({
                            id: uuidv4(),
                            uri: sentBoostUri,
                            category: BoostCategoryOptionsEnum.family,
                        });

                        await childLc.invoke.acceptCredential(sentBoostUri, {
                            skipNotification: true,
                        });

                        await wallet.invoke.updateBoostPermissions(
                            boostUri,
                            {
                                canCreateChildren: '',
                                canEdit: false,
                                canEditChildren: '',
                                canIssue: false,
                                canIssueChildren: '',
                                canManageChildrenPermissions: '',
                                canManagePermissions: false,
                                canRevoke: false,
                                canRevokeChildren: '',
                                canViewAnalytics: false,
                                canManageChildrenProfiles: false,
                            },
                            dependent?.profileId!
                        );

                        await wallet.invoke.removeBoostAdmin(boostUri, dependent?.profileId!);
                    })
                );
            }
        } catch (e) {
            console.error('handleCreateChildrenProfiles', e);
        }
    };

    const handleCreateFamily = async () => {
        if (!validate() || !validatePin()) {
            // return the user to the content tab to fix the errors
            setActiveTab(FamilyCMSTabsEnum.content);
            return;
        }

        const wallet = await initWallet();

        const currentUserProfileID = currentLCNUser?.profileId ?? '';

        const guardians: string[] = [
            ...(state?.admins?.map(admin => admin?.profileId) ?? []),
            currentUserProfileID,
        ];
        const dependents = state?.childAccounts;

        const payload = state;

        try {
            setIsPublishLoading(true);

            const { boostUri } = await createBoost({
                state: payload,
                status: LCNBoostStatusEnum.live,
                defaultClaimPermissions: {
                    role: 'Guardian',
                    canCreateChildren: '*',
                    canEdit: true,
                    canEditChildren: '*',
                    canIssue: true,
                    canIssueChildren: '*',
                    canManageChildrenPermissions: '*',
                    canManagePermissions: true,
                    canRevoke: true,
                    canRevokeChildren: '*',
                    canViewAnalytics: true,
                    canManageChildrenProfiles: true,
                },
            });

            try {
                await wallet.invoke.createClaimHook({
                    type: 'ADD_ADMIN',
                    data: {
                        claimUri: boostUri as string,
                        targetUri: boostUri as string,
                    },
                });
            } catch (e) {
                console.error('Family claim hook::error', e);
            }

            if (editorMode === FamilyCMSEditorModeEnum.create && !hasPin) {
                // create pin here
                const pin = state?.pin;
                if (pin?.length === 5) {
                    await createPin({ pin });
                }
            }

            // query param to open a preview of the family created with the issued VC uri
            let queryParamUri = '';

            if (boostUri) {
                if (guardians?.length > 0) {
                    // issue boost to admins
                    const uris = await handleIssueBoost(wallet, boostUri, guardians);

                    queryParamUri = uris?.[0] as string;

                    // add as admins
                    await handleAddAdmins(wallet, boostUri, guardians);
                }
                if (dependents?.length > 0) {
                    await handleCreateChildrenProfiles(wallet, boostUri, dependents);
                }
            }

            const switchedDid = switchedProfileStore.get.switchedDid();
            queryClient.refetchQueries({
                predicate: query =>
                    Array.isArray(query.queryKey) &&
                    query.queryKey[0] === 'getAvailableProfiles' &&
                    query.queryKey[1] === (switchedDid ?? ''),
            });

            setIsPublishLoading(false);
            handleCloseModal?.();
            onFamilyCreationSuccess?.();
            if (queryParamUri) {
                history.replace(`/families?boostUri=${queryParamUri}&showPreview=true`);
            }

            return;
        } catch (e) {
            setIsPublishLoading(false);
            console.error('handlePublishBoost::error', e);
            presentToast(`Error issuing boost`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleEditFamily = async () => {
        if (!editBoostUri) return;
        if (!validate()) {
            // return the user to the content tab to fix the errors
            setActiveTab(FamilyCMSTabsEnum.content);
            return;
        }

        try {
            setIsPublishLoading(true);

            const _state = cloneDeep(state);
            await editBoost({ boostUri: editBoostUri, state: _state });

            setIsPublishLoading(false);
            handleCloseModal?.();
            return;
        } catch (e) {
            setIsPublishLoading(false);
            console.error('handlePublishBoost::error', e);
            presentToast(`Error updating boost`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const thumbnail = state?.appearance?.badgeThumbnail ?? '';
    const familyEmoji = state?.appearance?.emoji ?? null;
    const familyName = state?.basicInfo?.name ?? '';
    const familyMotto = state?.basicInfo?.description ?? '';

    return (
        <IonPage>
            {(isLoading || isSaveLoading || isPublishLoading) && (
                <BoostLoader text={'Loading...'} darkBackground />
            )}
            <FamilyCMSHeader editorMode={editorMode} />
            <FamilyCMSLayout state={state}>
                <FamilyCrest
                    thumbnail={thumbnail}
                    familyName={familyName}
                    familyMotto={familyMotto}
                    emoji={familyEmoji}
                    showEmoji={state?.appearance?.toggleFamilyEmoji}
                    headerBackgroundColor={state?.appearance?.headerBackgroundColor}
                    headerFontColor={state?.appearance?.headerFontColor}
                />
                <div className="bg-white ion-padding rounded-b-[20px] shadow-soft-bottom py-[30px]">
                    <FamilyCMSTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                    {activeTab === FamilyCMSTabsEnum.content ? (
                        <FamilyCMSContentForm
                            errors={errors}
                            setErrors={setErrors}
                            state={state}
                            setState={setState}
                        />
                    ) : (
                        <FamilyCMSAppearanceForm state={state} setState={setState} />
                    )}
                </div>

                {activeTab === FamilyCMSTabsEnum.content && !hasPin && (
                    <FamilyPin
                        state={state}
                        setState={setState}
                        pinError={pinError}
                        setPinError={setPinError}
                    />
                )}
                {editorMode === FamilyCMSEditorModeEnum.create && (
                    <FamilyCMSMemberList state={state} setState={setState} />
                )}

                <FamilyCMSMemberTitlesToggle state={state} setState={setState} />
            </FamilyCMSLayout>
            <FamilyCMSFooter
                handleCreateFamily={handleCreateFamily}
                handleEditFamily={handleEditFamily}
                handleCloseModal={handleCloseModal}
                editorMode={editorMode}
            />
        </IonPage>
    );
};

export default FamilyCMS;
