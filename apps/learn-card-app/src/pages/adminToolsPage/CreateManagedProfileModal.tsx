import React, { useState } from 'react';
import { cloneDeep } from 'lodash';
import { useQueryClient } from '@tanstack/react-query';

import {
    useWallet,
    useToast,
    useModal,
    useFilestack,
    useCreateBoost,
    useCurrentUser,
    useGetCurrentLCNUser,
    switchedProfileStore,
    toKebabCase,
    initialBoostCMSState,
    getNotificationsEndpoint,
    constructCustomBoostType,
    UploadRes,
    BoostCategoryOptionsEnum,
    boostCategoryOptions,
    currentUserStore,
    UserProfilePicture,
} from 'learn-card-base';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';

import { IonInput, IonSpinner } from '@ionic/react';
import Pencil from '../../components/svgs/Pencil';

import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_LEARNCARD_ID_WALLPAPER,
    DEFAULT_LEARNCARD_WALLPAPER,
} from '../../components/learncardID-CMS/learncard-cms.helpers';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { useAddCredentialToWallet } from '../../components/boost/mutations';
import { sendBoostCredential } from '../../components/boost/boostHelpers';
import { LCNBoostStatusEnum } from '../../components/boost/boost';

type CreateManagedProfileModalProps = {};

const CreateManagedProfileModal: React.FC<CreateManagedProfileModalProps> = ({}) => {
    const { closeModal } = useModal();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const queryClient = useQueryClient();
    const currentUser = useCurrentUser();
    const parentUser = currentUserStore.use.parentUser();
    const currentUserPK = currentUserStore.use.currentUserPK();
    const isSwitchedProfile = switchedProfileStore?.get?.isSwitchedProfile();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { mutateAsync: createBoost } = useCreateBoost();
    const { mutateAsync: addCredentialToWallet } = useAddCredentialToWallet();

    const [name, setName] = useState('');
    const [image, setImage] = useState<string | undefined>(undefined);
    const [profileId, setProfileId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createManagedServiceProfile = async () => {
        setIsLoading(true);

        try {
            const wallet = await initWallet();

            const did = wallet.id.did(); // B

            const state = cloneDeep(initialBoostCMSState);
            state.basicInfo.name = `${name} Manager ID`;
            state.basicInfo.type = BoostCategoryOptionsEnum.id;
            state.basicInfo.achievementType = constructCustomBoostType(
                BoostCategoryOptionsEnum.id,
                'Managed Profile ID'
            );

            const defaultImage = boostCategoryOptions[BoostCategoryOptionsEnum.id].CategoryImage;
            state.appearance.badgeThumbnail = image || defaultImage;
            state.appearance.idBackgroundImage = image || DEFAULT_LEARNCARD_ID_WALLPAPER;

            // B creates this boost
            const { boostUri } = await createBoost({
                state,
                status: LCNBoostStatusEnum.live,
                defaultClaimPermissions: {
                    role: 'Manager',
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

            if (isSwitchedProfile) {
                // switched profile sends the Manager boost to the top level parent
                //   so that the parent has permissions over this newly created profile
                //   (i.e. so that the parent's PK can be used to manage this new profile)

                const pk =
                    currentUserStore.get.currentUserPK() ||
                    currentUserStore?.get?.currentUser()?.privateKey;
                const parentWallet = await getBespokeLearnCard(pk);

                // send boost to parent
                const { sentBoost, sentBoostUri } = await sendBoostCredential(
                    wallet,
                    currentUserStore.get.parentUserProfileId()!,
                    boostUri
                );

                // upload boost to parent's LearnCloud
                const issuedVcUri = await parentWallet?.store?.LearnCloud?.uploadEncrypted?.(
                    sentBoost
                );

                // add credential to parent's wallet
                await addCredentialToWallet({ uri: issuedVcUri, didOverride: true });

                // tell LCN "I claimed this, give me these permissions"
                await parentWallet.invoke.acceptCredential(sentBoostUri);
            }

            const managerDid = await wallet.invoke.createChildProfileManager(boostUri, {
                displayName: `${name} Manager`,
                image,
            });

            const managerLc = await getBespokeLearnCard(currentUser?.privateKey ?? '', managerDid);

            const managedProfileDid = await managerLc.invoke.createManagedProfile({
                isServiceProfile: true,
                displayName: name,
                profileId: profileId || toKebabCase(name),
                image,

                bio: '',
                shortBio: '',
                notificationsWebhook: getNotificationsEndpoint(), // Something special to do here?

                // could add more customizability here
                display: {
                    // container styles
                    backgroundColor: DEFAULT_COLOR_LIGHT,
                    backgroundImage: DEFAULT_LEARNCARD_WALLPAPER,
                    fadeBackgroundImage: false,
                    repeatBackgroundImage: false,

                    // id styles
                    fontColor: DEFAULT_COLOR_LIGHT,
                    accentColor: '#ffffff',
                    accentFontColor: '',
                    idBackgroundImage: image || DEFAULT_LEARNCARD_ID_WALLPAPER,
                    fadeIdBackgroundImage: true,
                    idBackgroundColor: '#2DD4BF',
                    repeatIdBackgroundImage: false,
                },
            });

            // refetch available profiles
            //   we can kick this off before issuing ourselves the boost since we have access to it by virtue of creating it
            const switchedDid = switchedProfileStore.get.switchedDid();
            queryClient.refetchQueries({
                predicate: query =>
                    Array.isArray(query.queryKey) &&
                    query.queryKey[0] === 'getAvailableProfiles' &&
                    query.queryKey[1] === (switchedDid ?? ''),
            });

            // Issue boost to self
            const { sentBoost, sentBoostUri } = await sendBoostCredential(
                wallet,
                currentLCNUser?.profileId,
                boostUri
            );
            const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(sentBoost);
            await addCredentialToWallet({ uri: issuedVcUri });

            presentToast(`Profile "${name}" created successfully!`);
            closeModal();
        } catch (e) {
            presentToast(`Failed to create "${name}": ${e.message}`);
            console.log('🔥🔥 Error in createManagedServiceProfile 🔥🔥');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data: UploadRes) => {
            setImage(data?.url);
            // setUploadProgress(false);
        },
        // options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    return (
        <>
            {isLoading && (
                <div className="absolute w-full h-full bg-white bg-opacity-50 z-9999 flex items-center justify-center backdrop-blur-[1px]">
                    <IonSpinner color="dark" />
                </div>
            )}

            <section className="text-grayscale-900 px-[20px] py-[30px] flex flex-col gap-[20px] items-center relative">
                <h1 className="text-center text-[24px]">Create Managed Profile</h1>

                <div className="bg-grayscale-100/40 relative flex items-center justify-between rounded-[40px] pb-[3px] pr-[10px] pt-[3px] max-w-[140px]">
                    <UserProfilePicture
                        customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[70px] min-h-[70px]"
                        customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[70px] min-h-[70px]"
                        customSize={120}
                        user={{ displayName: name, image }}
                    >
                        {imageUploading && (
                            <div className="user-image-upload-inprogress absolute flex h-[70px] min-h-[70px] w-[70px] min-w-[70px] items-center justify-center overflow-hidden rounded-full border-2 border-solid border-white text-xl font-medium text-whiteborder-white">
                                <IonSpinner name="crescent" color="dark" className="scale-[1.75]" />
                            </div>
                        )}
                    </UserProfilePicture>
                    <button
                        onClick={handleImageSelect}
                        type="button"
                        className="text-grayscale-900 ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
                    >
                        <Pencil className="h-[60%]" />
                    </button>
                </div>

                <IonInput
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                    onIonInput={e => setName(e.detail.value)}
                    value={name}
                    placeholder="Profile Name"
                    type="text"
                    label="Name*"
                />

                <IonInput
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                    onIonInput={e => setProfileId(e.detail.value)}
                    value={profileId}
                    placeholder={name ? toKebabCase(name) : 'Profile ID'}
                    type="text"
                    label="Profile ID"
                />

                <button
                    onClick={createManagedServiceProfile}
                    disabled={!name || isLoading}
                    className="bg-emerald-700 text-[20px] rounded-[20px] py-[6px] px-[12px] text-white disabled:opacity-60 disabled:bg-grayscale-500"
                >
                    Create
                </button>
            </section>
        </>
    );
};

export default CreateManagedProfileModal;
