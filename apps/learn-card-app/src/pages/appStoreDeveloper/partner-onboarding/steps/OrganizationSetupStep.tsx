import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { cloneDeep } from 'lodash';
import { useQueryClient } from '@tanstack/react-query';
import {
    Building,
    User,
    Plus,
    Check,
    ArrowRight,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

import {
    useWallet,
    useToast,
    useFilestack,
    useCreateBoost,
    useCurrentUser,
    useGetCurrentLCNUser,
    useSwitchProfile,
    useGetAvailableProfiles,
    useGetProfile,
    switchedProfileStore,
    currentUserStore,
    toKebabCase,
    initialBoostCMSState,
    getNotificationsEndpoint,
    constructCustomBoostType,
    UploadRes,
    BoostCategoryOptionsEnum,
    boostCategoryMetadata,
    UserProfilePicture,
    ToastTypeEnum,
} from 'learn-card-base';

import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { useAddCredentialToWallet } from '../../../../components/boost/mutations';
import { sendBoostCredential } from '../../../../components/boost/boostHelpers';
import { LCNBoostStatusEnum } from '../../../../components/boost/boost';
import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_LEARNCARD_ID_WALLPAPER,
    DEFAULT_LEARNCARD_WALLPAPER,
} from '../../../../components/learncardID-CMS/learncard-cms.helpers';
import useLCNGatedAction from '../../../../components/network-prompts/hooks/useLCNGatedAction';

import { OrganizationProfile } from '../types';
import { LCNProfile } from '@learncard/types';

interface OrganizationSetupStepProps {
    organization: OrganizationProfile | null;
    onComplete: (organization: OrganizationProfile) => void;
}

const NameValidator = z.object({
    name: z
        .string()
        .nonempty('Name is required.')
        .min(3, 'Must contain at least 3 characters.')
        .max(30, 'Must contain at most 30 characters.')
        .regex(/^[A-Za-z0-9 ]+$/, 'Alpha numeric characters only'),
});

const ProfileIDValidator = z.object({
    profileId: z
        .string()
        .nonempty('Profile ID is required.')
        .min(3, 'Must contain at least 3 characters.')
        .max(25, 'Must contain at most 25 characters.')
        .regex(/^[a-zA-Z0-9-]+$/, 'Alpha numeric characters and dashes only, no spaces.'),
});

type SetupMode = 'select' | 'create';

export const OrganizationSetupStep: React.FC<OrganizationSetupStepProps> = ({
    organization,
    onComplete,
}) => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { gate } = useLCNGatedAction();

    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: profiles, isLoading: profilesLoading } = useGetAvailableProfiles();
    const { handleSwitchAccount, handleSwitchBackToParentAccount, isSwitching } = useSwitchProfile();

    const isSwitchedProfile = switchedProfileStore?.use?.isSwitchedProfile();
    const parentUser = currentUserStore.get.parentUser();
    const parentUserDid = currentUserStore.get.parentUserDid();
    const isCurrentUserServiceProfile = currentLCNUser?.isServiceProfile;

    const { mutateAsync: createBoost } = useCreateBoost();
    const { mutateAsync: addCredentialToWallet } = useAddCredentialToWallet();

    const [mode, setMode] = useState<SetupMode>('select');
    const [selectedProfile, setSelectedProfile] = useState<OrganizationProfile | null>(organization);

    // Create organization form state
    const [orgName, setOrgName] = useState('');
    const [profileId, setProfileId] = useState('');
    const [image, setImage] = useState<string | undefined>(undefined);
    const [isCreating, setIsCreating] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Validation state
    const [nameError, setNameError] = useState('');
    const [profileIdError, setProfileIdError] = useState('');
    const [isLengthValid, setIsLengthValid] = useState(false);
    const [isFormatValid, setIsFormatValid] = useState(false);
    const [isUniqueValid, setIsUniqueValid] = useState(false);

    const {
        data: uniqueProfile,
        isFetching: uniqueProfileFetching,
    } = useGetProfile(profileId ?? '');

    const { handleFileSelect: handleImageSelect, isLoading: imageUploading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data: UploadRes) => {
            setImage(data?.url);
        },
    });

    // Filter to only show service profiles (organizations)
    const profileRecords = (profiles as any)?.records ?? [];
    const serviceProfiles = profileRecords.filter(
        ({ profile }: { profile: LCNProfile }) => profile.isServiceProfile
    );

    // Check profile uniqueness
    useEffect(() => {
        setIsUniqueValid(false);
    }, [profileId]);

    useEffect(() => {
        if (!uniqueProfileFetching && profileId) {
            setIsUniqueValid(uniqueProfile === null);
        }
    }, [uniqueProfile, uniqueProfileFetching, profileId]);

    // Auto-generate profile ID from name
    useEffect(() => {
        if (orgName && !showAdvanced) {
            setProfileId(toKebabCase(orgName));
        }
    }, [orgName, showAdvanced]);

    const handleProfileIdInput = (value: string) => {
        setProfileId(value);
        setProfileIdError('');

        const lengthOk = value.length >= 3 && value.length <= 25;
        setIsLengthValid(lengthOk);

        const formatOk = /^[a-zA-Z0-9-]+$/.test(value);
        setIsFormatValid(formatOk);
    };

    const validateName = () => {
        const result = NameValidator.safeParse({ name: orgName });
        if (!result.success) {
            setNameError(result.error.issues[0]?.message || 'Invalid name');
            return false;
        }
        setNameError('');
        return true;
    };

    const validateProfileId = () => {
        const result = ProfileIDValidator.safeParse({ profileId });
        if (!result.success) {
            setProfileIdError(result.error.issues[0]?.message || 'Invalid profile ID');
            return false;
        }
        if (!isUniqueValid && !uniqueProfileFetching) {
            setProfileIdError('This profile ID is already taken');
            return false;
        }
        setProfileIdError('');
        return true;
    };

    const handleSelectExistingProfile = async (profile: LCNProfile, manager: LCNProfile) => {
        const orgProfile: OrganizationProfile = {
            did: profile.did!,
            profileId: profile.profileId!,
            displayName: profile.displayName!,
            image: profile.image,
            isServiceProfile: true,
        };

        setSelectedProfile(orgProfile);

        // Switch to this profile
        const switchedUser = {
            ...manager,
            did: profile.did,
            profileId: profile.profileId,
            isServiceProfile: profile.isServiceProfile,
        };

        await handleSwitchAccount(switchedUser as LCNProfile);
    };

    const handleUseCurrentAccount = () => {
        if (!currentLCNUser) return;

        const orgProfile: OrganizationProfile = {
            did: currentLCNUser.did!,
            profileId: currentLCNUser.profileId!,
            displayName: currentLCNUser.displayName!,
            image: currentLCNUser.image,
            isServiceProfile: currentLCNUser.isServiceProfile ?? false,
        };

        setSelectedProfile(orgProfile);
    };

    const handleUseParentAccount = async () => {
        if (!parentUser || !parentUserDid) return;

        const parentProfile: OrganizationProfile = {
            did: parentUserDid,
            profileId: (parentUser as any).profileId ?? parentUser.name ?? '',
            displayName: parentUser.name ?? 'Personal Account',
            image: parentUser.profileImage,
            isServiceProfile: false,
        };

        setSelectedProfile(parentProfile);

        // Switch back to the parent account
        await handleSwitchBackToParentAccount();
    };

    const createManagedServiceProfile = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        if (!validateName() || !validateProfileId()) {
            return;
        }

        setIsCreating(true);

        try {
            const wallet = await initWallet();

            const state = cloneDeep(initialBoostCMSState);
            state.basicInfo.name = `${orgName} Manager ID`;
            state.basicInfo.type = BoostCategoryOptionsEnum.id;
            state.basicInfo.achievementType = constructCustomBoostType(
                BoostCategoryOptionsEnum.id,
                'Managed Profile ID'
            );

            const defaultImage = boostCategoryMetadata[BoostCategoryOptionsEnum.id].CategoryImage;
            state.appearance.badgeThumbnail = image || defaultImage;
            state.appearance.idBackgroundImage = image || DEFAULT_LEARNCARD_ID_WALLPAPER;

            // Create the manager boost
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

            if (!boostUri) {
                throw new Error('Failed to create manager boost');
            }

            if (isSwitchedProfile) {
                const pk =
                    currentUserStore.get.currentUserPK() ||
                    currentUserStore?.get?.currentUser()?.privateKey;
                const parentProfileId = currentUserStore.get.parentUserProfileId();

                if (pk && parentProfileId) {
                    const parentWallet = await getBespokeLearnCard(pk);
                    const { sentBoost, sentBoostUri } = await sendBoostCredential(
                        wallet,
                        parentProfileId,
                        boostUri
                    );

                    if (sentBoost && sentBoostUri) {
                        const issuedVcUri = await parentWallet?.store?.LearnCloud?.uploadEncrypted?.(
                            sentBoost
                        );

                        if (issuedVcUri) {
                            await addCredentialToWallet({ uri: issuedVcUri, didOverride: true });
                        }
                        await parentWallet.invoke.acceptCredential(sentBoostUri);
                    }
                }
            }

            const managerDid = await wallet.invoke.createChildProfileManager(boostUri, {
                displayName: `${orgName} Manager`,
                image,
            });

            const managerLc = await getBespokeLearnCard(currentUser?.privateKey ?? '', managerDid);

            const managedProfileDid = await managerLc.invoke.createManagedProfile({
                isServiceProfile: true,
                displayName: orgName,
                profileId: profileId || toKebabCase(orgName),
                image,
                bio: '',
                shortBio: '',
                notificationsWebhook: getNotificationsEndpoint(),
                display: {
                    backgroundColor: DEFAULT_COLOR_LIGHT,
                    backgroundImage: DEFAULT_LEARNCARD_WALLPAPER,
                    fadeBackgroundImage: false,
                    repeatBackgroundImage: false,
                    fontColor: DEFAULT_COLOR_LIGHT,
                    accentColor: '#ffffff',
                    accentFontColor: '',
                    idBackgroundImage: image || DEFAULT_LEARNCARD_ID_WALLPAPER,
                    fadeIdBackgroundImage: true,
                    idBackgroundColor: '#2DD4BF',
                    repeatIdBackgroundImage: false,
                },
            });

            // Refetch available profiles
            const switchedDid = switchedProfileStore.get.switchedDid();
            queryClient.refetchQueries({
                predicate: query =>
                    Array.isArray(query.queryKey) &&
                    query.queryKey[0] === 'getAvailableProfiles' &&
                    query.queryKey[1] === (switchedDid ?? ''),
            });

            // Issue boost to self
            if (currentLCNUser?.profileId) {
                const { sentBoost, sentBoostUri } = await sendBoostCredential(
                    wallet,
                    currentLCNUser.profileId,
                    boostUri
                );

                if (sentBoost) {
                    const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(sentBoost);
                    if (issuedVcUri) {
                        await addCredentialToWallet({ uri: issuedVcUri });
                    }
                }
            }

            // Create the organization profile object
            const newOrgProfile: OrganizationProfile = {
                did: managedProfileDid,
                profileId: profileId || toKebabCase(orgName),
                displayName: orgName,
                image,
                isServiceProfile: true,
            };

            setSelectedProfile(newOrgProfile);

            // Switch to the new profile
            await handleSwitchAccount({
                did: managedProfileDid,
                profileId: profileId || toKebabCase(orgName),
                displayName: orgName,
                image,
                isServiceProfile: true,
            } as LCNProfile);

            presentToast(`Organization "${orgName}" created successfully!`);
            setMode('select');
        } catch (e: any) {
            presentToast(`Failed to create organization: ${e?.message}`, {
                type: ToastTypeEnum.Error,
            });
            console.error('Error creating organization:', e);
        } finally {
            setIsCreating(false);
        }
    };

    const canProceed = selectedProfile !== null;

    if (profilesLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
                <p className="text-gray-500">Loading profiles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Building className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Organization Account</p>
                    <p>
                        Choose or create an organization account that will be used as the issuer for 
                        your credentials. This determines the DID, API keys, and branding for your integration.
                    </p>
                </div>
            </div>

            {mode === 'select' ? (
                <>
                    {/* Current Account Option */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-800">Use Current Account</h3>

                        <button
                            onClick={handleUseCurrentAccount}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                selectedProfile?.did === currentLCNUser?.did
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <UserProfilePicture
                                user={{ image: currentLCNUser?.image, displayName: currentLCNUser?.displayName }}
                                customContainerClass="w-12 h-12 rounded-full overflow-hidden"
                            />

                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-800">
                                        {currentLCNUser?.displayName}
                                    </p>

                                    {isCurrentUserServiceProfile && (
                                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                                            Organization
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-gray-500">@{currentLCNUser?.profileId}</p>
                            </div>

                            {selectedProfile?.did === currentLCNUser?.did && (
                                <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Root Personal Account Option (when on a service profile) */}
                    {isCurrentUserServiceProfile && isSwitchedProfile && parentUser && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-800">Or Use Personal Account</h3>

                            <button
                                onClick={handleUseParentAccount}
                                disabled={isSwitching}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                    selectedProfile?.did === parentUserDid
                                        ? 'border-cyan-500 bg-cyan-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <UserProfilePicture
                                    user={{ image: parentUser.profileImage, displayName: parentUser.name }}
                                    customContainerClass="w-12 h-12 rounded-full overflow-hidden"
                                />

                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-800">
                                            {parentUser.name ?? 'Personal Account'}
                                        </p>

                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                            Personal
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-500">Your root personal account</p>
                                </div>

                                {isSwitching && selectedProfile?.did === parentUserDid ? (
                                    <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                                ) : selectedProfile?.did === parentUserDid ? (
                                    <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                ) : null}
                            </button>
                        </div>
                    )}

                    {/* Existing Organization Accounts */}
                    {serviceProfiles.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-800">
                                Or Switch to Organization Account
                            </h3>

                            <div className="space-y-2">
                                {serviceProfiles.map(({ profile, manager }: { profile: LCNProfile; manager: LCNProfile }, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectExistingProfile(profile, manager)}
                                        disabled={isSwitching}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                            selectedProfile?.did === profile.did
                                                ? 'border-cyan-500 bg-cyan-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <UserProfilePicture
                                            user={{ image: profile.image, displayName: profile.displayName }}
                                            customContainerClass="w-12 h-12 rounded-full overflow-hidden"
                                        />

                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-800">
                                                    {profile.displayName}
                                                </p>
                                                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                                                    Organization
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">@{profile.profileId}</p>
                                        </div>

                                        {isSwitching && selectedProfile?.did === profile.did ? (
                                            <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                                        ) : selectedProfile?.did === profile.did ? (
                                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create New Organization */}
                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setMode('create')}
                            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Organization Account
                        </button>
                    </div>
                </>
            ) : (
                /* Create Organization Form */
                <div className="space-y-6">
                    <button
                        onClick={() => setMode('select')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        ← Back to selection
                    </button>

                    {/* Organization Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Organization Name <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => {
                                setOrgName(e.target.value);
                                setNameError('');
                            }}
                            placeholder="e.g., Ascend Learning"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        />

                        {nameError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {nameError}
                            </p>
                        )}
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Organization Logo
                        </label>

                        <div className="flex items-center gap-4">
                            {image ? (
                                <img
                                    src={image}
                                    alt="Logo preview"
                                    className="w-16 h-16 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <Building className="w-8 h-8 text-gray-400" />
                                </div>
                            )}

                            <button
                                onClick={handleImageSelect}
                                disabled={imageUploading}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {imageUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Upload Logo'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Advanced Settings
                    </button>

                    {showAdvanced && (
                        <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700">
                                Profile ID <span className="text-red-500">*</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">@</span>
                                <input
                                    type="text"
                                    value={profileId}
                                    onChange={(e) => handleProfileIdInput(e.target.value)}
                                    placeholder="organization-id"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${isLengthValid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    3-25 characters
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${isFormatValid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    Letters, numbers, dashes only
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${isUniqueValid ? 'bg-emerald-100 text-emerald-700' : uniqueProfileFetching ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {uniqueProfileFetching ? 'Checking...' : isUniqueValid ? 'Available' : 'Must be unique'}
                                </span>
                            </div>

                            {profileIdError && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {profileIdError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Create Button */}
                    <button
                        onClick={createManagedServiceProfile}
                        disabled={!orgName.trim() || isCreating}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating Organization...
                            </>
                        ) : (
                            <>
                                <Building className="w-5 h-5" />
                                Create Organization Account
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Navigation */}
            {mode === 'select' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => canProceed && onComplete(selectedProfile!)}
                        disabled={!canProceed}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Continue to Project Setup
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};
