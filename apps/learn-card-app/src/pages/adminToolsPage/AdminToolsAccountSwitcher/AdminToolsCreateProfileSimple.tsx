import { z } from 'zod';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import ChildInviteModalSimple from '../../../components/familyCMS/FamilyCMSInviteModal/ChildInviteModal/ChildInviteModalSimple';
import AdminToolsFamilySelectorButton from './AdminToolsFamilySelectorButton';
import HandleIcon from 'learn-card-base/svgs/HandleIcon';
import Pencil from '../../../components/svgs/Pencil';
import { IonInput, IonSpinner } from '@ionic/react';
import { Checkmark } from '@learncard/react';
import X from 'learn-card-base/svgs/X';

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
    boostCategoryMetadata,
    currentUserStore,
    UserProfilePicture,
    useGetProfile,
    CredentialCategoryEnum,
    useGetCredentials,
    ToastTypeEnum,
} from 'learn-card-base';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';

import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_LEARNCARD_ID_WALLPAPER,
    DEFAULT_LEARNCARD_WALLPAPER,
    getLearnCardIDStyleDefaults,
} from '../../../components/learncardID-CMS/learncard-cms.helpers';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { useAddCredentialToWallet } from '../../../components/boost/mutations';
import { sendBoostCredential } from '../../../components/boost/boostHelpers';
import { LCNBoostStatusEnum } from '../../../components/boost/boost';
import { LearnCardIDCMSTabsEnum } from 'apps/learn-card-app/src/components/learncardID-CMS/LearnCardIDCMSTabs';
import { useCreateChildAccount } from 'apps/learn-card-app/src/hooks/useCreateChildAccount';
import useLCNGatedAction from 'apps/learn-card-app/src/components/network-prompts/hooks/useLCNGatedAction';

const StateValidator = z.object({
    name: z
        .string()
        .nonempty(' Name is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(30, ' Must contain at most 30 character(s).')
        .regex(/^[A-Za-z0-9 ]+$/, ' Alpha numeric characters(s) only'),
});

const ProfileIDStateValidator = z.object({
    profileId: z
        .string()
        .nonempty(' User ID is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(25, ' Must contain at most 25 character(s).')
        .regex(
            /^[a-zA-Z0-9-]+$/,
            ` Alpha numeric characters(s) and dashes '-' only, no spaces allowed.`
        ),
});

type AdminToolsCreateProfileSimpleProps = { profileType: 'child' | 'organization' };

const AdminToolsCreateProfileSimple: React.FC<AdminToolsCreateProfileSimpleProps> = ({
    profileType,
}) => {
    const { closeModal } = useModal();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const queryClient = useQueryClient();
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { gate } = useLCNGatedAction();
    const isSwitchedProfile = switchedProfileStore?.get?.isSwitchedProfile();

    const { mutateAsync: createBoost } = useCreateBoost();
    const { mutateAsync: addCredentialToWallet } = useAddCredentialToWallet();
    const { mutate: createChildAccount } = useCreateChildAccount();

    const [name, setName] = useState('');
    const [shortBio, setShortBio] = useState('');
    const [profileId, setProfileId] = useState('');
    const [image, setImage] = useState<string | undefined>(undefined);

    const [isLengthValid, setIsLengthValid] = useState(false);
    const [isFormatValid, setIsFormatValid] = useState(false);
    const [isUniqueValid, setIsUniqueValid] = useState(false);

    const [profileIdError, setProfileIdError] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [profileIdErrors, setProfileIdErrors] = useState<Record<string, string[]>>({});

    const [isLoading, setIsLoading] = useState(false);

    const { data: families } = useGetCredentials(CredentialCategoryEnum.family);

    const [selectedFamily, setSelectedFamily] = useState<
        { name: string; picture: string; uri: string } | undefined
    >(undefined);

    const {
        data: uniqueProfile,
        isLoading: uniqueProfileLoading,
        isFetching: uniqueProfileFetching,
    } = useGetProfile(profileId ?? '');

    useEffect(() => {
        setIsUniqueValid(false);
    }, [profileId]);

    useEffect(() => {
        if (!uniqueProfileFetching && profileId) {
            setIsUniqueValid(uniqueProfile === null);
        }
    }, [uniqueProfile, uniqueProfileFetching, profileId]);

    useEffect(() => {
        if (families) {
            setSelectedFamily({
                name: families[0]?.boostCredential?.name,
                picture: families[0]?.boostCredential?.image,
                uri: families[0]?.boostId,
            });
        }
    }, [families]);

    const { handleFileSelect: handleImageSelect, isLoading: imageUploading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data: UploadRes) => {
            setImage(data?.url);
            // setUploadProgress(false);
        },
        // options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            name: name,
            // dob: dob,
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

    const validateProfileID = () => {
        const parsedData = ProfileIDStateValidator.safeParse({
            profileId: profileId,
        });

        if (parsedData.success) {
            setProfileIdErrors({});
            setProfileIdError('');
            return true;
        }

        if (parsedData.error) {
            setProfileIdErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const handleProfileIdInput = (value: string) => {
        setProfileId(value);
        setProfileIdErrors({});
        setProfileIdError('');

        const lengthOk = value.length >= 3 && value.length <= 25;
        setIsLengthValid(lengthOk);

        const formatOk = /^[a-zA-Z0-9-]+$/.test(value);
        setIsFormatValid(formatOk);
    };

    const createManagedServiceProfile = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        setIsLoading(true);

        try {
            if (!validate() || !validateProfileID()) {
                setIsLoading(false);
                return;
            }

            const wallet = await initWallet();

            const did = wallet.id.did(); // B

            const state = cloneDeep(initialBoostCMSState);
            state.basicInfo.name = `${name} Manager ID`;
            state.basicInfo.type = BoostCategoryOptionsEnum.id;
            state.basicInfo.achievementType = constructCustomBoostType(
                BoostCategoryOptionsEnum.id,
                'Managed Profile ID'
            );

            const defaultImage = boostCategoryMetadata[BoostCategoryOptionsEnum.id].CategoryImage;
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
            presentToast(`Failed to create "${name}": ${e?.message}`, {
                type: ToastTypeEnum.Error,
            });
            console.log('🔥🔥 Error in createManagedServiceProfile 🔥🔥');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateChildAccount = async () => {
        if (validate()) {
            setIsLoading(true);
            try {
                await createChildAccount({
                    childAccount: {
                        name: name ?? '',
                        shortBio: shortBio ?? '',
                        image: image ?? '',
                        profileId: uuidv4(),
                        learnCardID: getLearnCardIDStyleDefaults(LearnCardIDCMSTabsEnum.dark),
                    },
                    boostUri: selectedFamily?.uri,
                });

                closeModal();
                presentToast(`Profile "${name}" created successfully!`);
                return;
            } catch (e) {
                presentToast(`Failed to create "${name}": ${e?.message}`, {
                    type: ToastTypeEnum.Error,
                });
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const placeholderStyles = {
        '--placeholder-color': '#52597a',
        fontSize: '16px',
        fontWeight: '400',
        fontFamily: 'Poppins',
    };

    const isCheckingUnique = uniqueProfileLoading || uniqueProfileFetching;
    const isProfileIdValid = isUniqueValid && isLengthValid && isFormatValid;

    if (profileType === 'child') {
        return (
            <ChildInviteModalSimple
                selectedFamily={selectedFamily}
                setSelectedFamily={setSelectedFamily}
            />
        );
    }

    return (
        <>
            <section className="text-grayscale-900 px-[20px] py-[30px] flex flex-col gap-[20px] items-center relative bg-white rounded-[20px]">
                <h1 className="text-center text-[24px]">
                    {profileType === 'organization'
                        ? 'Create New Organization'
                        : 'Create a New Profile'}
                </h1>

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

                {profileType === 'child' && (
                    <AdminToolsFamilySelectorButton
                        setSelectedFamily={setSelectedFamily}
                        families={families}
                        selectedFamily={selectedFamily}
                    />
                )}

                <div className="flex flex-col items-center justify-center w-full">
                    <IonInput
                        style={placeholderStyles}
                        autocapitalize="on"
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                            errors.name ? 'login-input-email-error' : ''
                        }`}
                        onIonInput={e => {
                            setErrors({});
                            setName(e.detail.value);
                        }}
                        value={name}
                        placeholder={profileType === 'child' ? 'Name' : 'Organization Name'}
                        type="text"
                        aria-label="Full Name"
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                            {errors.name}
                        </p>
                    )}
                </div>

                {profileType === 'child' && (
                    <div className="flex flex-col items-center justify-center w-full pb-2">
                        <IonInput
                            style={placeholderStyles}
                            autocapitalize="on"
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                                errors.shortBio ? 'login-input-email-error' : ''
                            }`}
                            onIonInput={e => {
                                setErrors({});
                                setShortBio(e.detail.value);
                            }}
                            value={shortBio}
                            placeholder="Tagline"
                            type="text"
                            aria-label="Tagline"
                            disabled={isLoading}
                        />
                        {errors.shortBio && (
                            <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                                {errors.shortBio}
                            </p>
                        )}
                    </div>
                )}

                {profileType === 'organization' && (
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="flex flex-col items-center justify-center w-full mb-4">
                            <div
                                className={`flex items-center w-full bg-grayscale-100 rounded-[15px] ${
                                    profileIdError || profileIdErrors?.profileId
                                        ? 'login-input-email-error'
                                        : ''
                                }`}
                            >
                                <span className="pl-4 !pr-0 text-grayscale-500 select-none font-semibold">
                                    <HandleIcon className="w-[20px] h-[20px] text-grayscale-700" />
                                </span>
                                <IonInput
                                    style={placeholderStyles}
                                    autocapitalize="on"
                                    className={`flex-1 bg-transparent text-grayscale-800 !pr-4 !pl-2 !py-[6px] font-medium tracking-widest text-base text-left `}
                                    onIonInput={e => {
                                        handleProfileIdInput(e.detail.value);
                                    }}
                                    value={profileId}
                                    placeholder="Organization Profile ID"
                                    aria-label="Organization Profile ID"
                                    type="text"
                                    disabled={isLoading}
                                />
                            </div>
                            {(profileIdError || profileIdErrors?.profileId) && (
                                <p className="p-0 m-0 mt-1 w-full text-left text-sm text-red-600">
                                    {profileIdError}
                                    {profileIdErrors?.profileId?.map(e => e)}
                                </p>
                            )}
                        </div>

                        <div className="w-full flex flex-col justify-center items-start text-left">
                            <p className="flex items-center justify-start gap-1 text-grayscale-700 text-xs font-normal min-h-[20px] h-[20px]">
                                {isLengthValid ? (
                                    <Checkmark className="w-[20px] h-auto" />
                                ) : (
                                    <X className="w-[20px] h-auto scale-[0.9]" />
                                )}
                                Must be between 3 to 25 characters.
                            </p>

                            <p className="flex items-center gap-1 text-grayscale-700 text-xs font-normal min-h-[20px] h-[20px]">
                                {isFormatValid ? (
                                    <Checkmark className="w-[20px] h-auto" />
                                ) : (
                                    <X className="w-[20px] h-auto scale-[0.9]" />
                                )}
                                Letters, numbers, and dashes (-) only.
                            </p>

                            <p className="flex items-center gap-1 text-grayscale-700 text-xs font-normal min-h-[20px] h-[20px]">
                                {isCheckingUnique && (
                                    <IonSpinner
                                        name="crescent"
                                        className="h-[20px] w-[20px] scale-[0.75]"
                                    />
                                )}
                                {isUniqueValid && !isCheckingUnique && (
                                    <Checkmark className="w-[20px] h-auto" />
                                )}
                                {!isUniqueValid && !isCheckingUnique && (
                                    <X className="w-[20px] h-auto scale-[0.9]" />
                                )}
                                Must be unique.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <div className="w-full flex items-center justify-center mt-4 gap-4">
                <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-full bg-white text-grayscale-800 py-2 shadow-sm"
                >
                    Close
                </button>
                <button
                    type="button"
                    disabled={profileType === 'organization' ? !isProfileIdValid || !name : !name}
                    onClick={
                        profileType === 'child'
                            ? () => handleCreateChildAccount()
                            : () => createManagedServiceProfile()
                    }
                    className="flex-1 rounded-full bg-grayscale-900 text-white py-2 shadow-sm disabled:bg-grayscale-500"
                >
                    {isLoading ? 'Creating...' : 'Create'}
                </button>
            </div>
        </>
    );
};

export default AdminToolsCreateProfileSimple;
