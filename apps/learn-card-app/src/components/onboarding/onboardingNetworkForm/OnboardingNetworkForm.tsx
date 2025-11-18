import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import moment from 'moment';
import { z } from 'zod';

import { IonCol, IonRow, IonInput, IonSpinner, IonDatetime } from '@ionic/react';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import OnboardingRoleItem from '../onboardingRoles/OnboardingRoleItem';
import OnboardingHeader from '../onboardingHeader/OnboardingHeader';
import OnboardingFooter from '../onboardingFooter/OnboardingFooter';
import ErrorLogout from '../../network-prompts/ErrorLogout';
import HandleIcon from 'learn-card-base/svgs/HandleIcon';
import { Checkmark } from '@learncard/react';
import Calendar from '../../svgs/Calendar';
import Pencil from '../../svgs/Pencil';
import X from 'learn-card-base/svgs/X';

import { useFilestack, UploadRes } from 'learn-card-base';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import {
    authStore,
    currentUserStore,
    useSQLiteStorage,
    useModal,
    useWallet,
    useGetProfile,
    useGetCurrentLCNUser,
    useIsCurrentUserLCNUser,
    getNotificationsEndpoint,
    SocialLoginTypes,
    ModalTypes,
} from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { getAuthToken } from 'learn-card-base/helpers/authHelpers';
import {
    LearnCardRoles,
    LearnCardRolesEnum,
    LearnCardRoleType,
    OnboardingStepsEnum,
} from '../onboarding.helpers';

const StateValidator = z.object({
    name: z
        .string()
        .nonempty(' Name is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(30, ' Must contain at most 30 character(s).')
        .regex(/^[A-Za-z0-9 ]+$/, ' Alpha numeric characters(s) only'),
    // dob: z
    //     .string()
    //     .nonempty(' Date of birth is required.')
    //     .refine(
    //         dob => {
    //             const dobMoment = moment(dob, 'YYYY-MM-DD');
    //             return moment().diff(dobMoment, 'years') >= 13;
    //         },
    //         {
    //             message: ' You must be at least 13 years old.',
    //         }
    //     ),
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

type OnboardingNetworkFormProps = {
    showHeader?: boolean;
    containerClassName?: string;
    handleCloseModal: () => void;
    step?: OnboardingStepsEnum;
    role?: LearnCardRolesEnum | null;
    setStep?: (step: OnboardingStepsEnum) => void;
};

const OnboardingNetworkForm: React.FC<OnboardingNetworkFormProps> = ({
    handleCloseModal,
    showHeader = true,
    containerClassName,
    step,
    setStep,
    role,
}) => {
    const { initWallet } = useWallet();
    const { newModal, closeModal } = useModal();
    const { refetch } = useGetCurrentLCNUser();
    const { refetch: refetchIsCurrentUserLCNUser } = useIsCurrentUserLCNUser();
    const queryClient = useQueryClient();

    const authToken = getAuthToken();
    const currentUser = useCurrentUser();
    const { updateCurrentUser } = useSQLiteStorage();

    const [name, setName] = useState<string | null | undefined>(currentUser?.name ?? '');
    const [dob, setDob] = useState<string | null | undefined>('');
    const [photo, setPhoto] = useState<string | null | undefined>(currentUser?.profileImage ?? '');

    const [networkToggle, setNetworkToggle] = useState<boolean>(true);

    const [profileId, setProfileId] = useState<string | null | undefined>('');
    const [isLengthValid, setIsLengthValid] = useState(false);
    const [isFormatValid, setIsFormatValid] = useState(false);
    const [isUniqueValid, setIsUniqueValid] = useState(false);

    const [walletDid, setWalletDid] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [createLoading, setIsCreateLoading] = useState<boolean>(false);
    const [profileIdError, setProfileIdError] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [profileIdErrors, setProfileIdErrors] = useState<Record<string, string[]>>({});

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const { data: lcNetworkProfile, isLoading: profileLoading } = useGetProfile();

    const presentLogoutErrorModal = () => {
        newModal(<ErrorLogout />, { sectionClassName: '!max-w-[400px]' });
    };

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) {
            getWalletDid();
        }
    }, [walletDid]);

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

    const onUpload = (data: UploadRes) => {
        setPhoto(data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
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

    const handleStorageUpdate = async () => {
        await updateCurrentUser(currentUser?.privateKey, {
            name: name ?? currentUser?.name ?? '',
            profileImage: photo ?? currentUser?.profileImage ?? '',
        });
        currentUserStore.set.currentUser({
            ...currentUser,
            name: name ?? currentUser?.name ?? '',
            profileImage: photo ?? currentUser?.profileImage ?? '',
        });
    };

    const handleJoinLearnCardNetwork = async () => {
        if (validateProfileID()) {
            try {
                setIsLoading(true);
                setIsCreateLoading(true);
                const wallet = await initWallet();
                const didWeb = await wallet.invoke.createProfile({
                    did: wallet.id.did(),
                    profileId: profileId as string,
                    displayName: name ?? '',
                    image: photo ?? '',
                    notificationsWebhook: getNotificationsEndpoint(),
                    role: role ?? '',
                    // dob: dob ?? '',
                });

                if (didWeb) {
                    await refetchIsCurrentUserLCNUser();
                    await wallet.invoke.resetLCAClient();
                    await queryClient.resetQueries();
                    await refetch(); // refetch to sync -> useGetCurrentLCNUser hook
                    handleCloseModal();
                    setIsLoading(false);
                    setIsCreateLoading(false);
                }
            } catch (err) {
                console.log('createProfile::error', err);
                setProfileIdError(err?.message);
                setIsLoading(false);
                setIsCreateLoading(false);
            }
        }
    };

    const handleLCNetworkProfileUpdate = async () => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) {
            const updatedProfile = await wallet?.invoke?.updateProfile({
                displayName: name ?? '',
                image: photo ?? '',
                // dob: dob ?? '',
                role: role ?? '',
                notificationsWebhook: getNotificationsEndpoint(),
            });
            console.log('updatedProfile::res', updatedProfile);
        } else {
            await handleJoinLearnCardNetwork();
        }
    };

    const handleUpdateUser = async () => {
        const typeOfLogin = authStore.get.typeOfLogin();

        // ! APPLE HOT FIX
        if (typeOfLogin === SocialLoginTypes.apple) {
            // ! apple's guidelines: name should NOT be required
            await updateProfile(auth()?.currentUser, {
                displayName: name ?? '',
                photoURL: photo ?? '',
            });

            handleStorageUpdate();

            // update LC network profile
            await handleLCNetworkProfileUpdate();

            setIsLoading(false);
            handleCloseModal();
            // ! APPLE HOT FIX
        } else {
            if (validate()) {
                setIsLoading(true);
                try {
                    if (authToken === 'dummy') {
                        currentUserStore.set.currentUser({
                            ...currentUser,
                            name: name ?? currentUser?.name ?? '',
                            profileImage: photo ?? currentUser?.profileImage ?? '',
                        });

                        // update LC network profile
                        await handleLCNetworkProfileUpdate();

                        setIsLoading(false);
                        // handleCloseModal();
                    } else {
                        // update firebase profile
                        try {
                            await updateProfile(auth()?.currentUser, {
                                displayName: name,
                                photoURL: photo,
                            });
                        } catch (e) {
                            presentLogoutErrorModal();
                            setProfileIdError(`There was a firebase error: ${e?.toString?.()}`);
                        }
                        // update LC network profile
                        await handleLCNetworkProfileUpdate();

                        // update sqlite + context store
                        handleStorageUpdate();

                        setIsLoading(false);
                        // handleCloseModal();
                    }
                } catch (error) {
                    setIsLoading(false);
                    console.log('updateProfile::error', error);
                }
            }
        }
    };

    const handleClick = () => {
        if (!isLoading) {
            handleUpdateUser();
        }
    };

    const placeholderStyles = {
        '--placeholder-color': '#52597a',
        fontSize: '16px',
        fontWeight: '400',
        fontFamily: 'Poppins',
    };

    const isCheckingUnique = uniqueProfileLoading || uniqueProfileFetching;

    return (
        <div className="w-full h-full bg-white relative">
            <div className="max-w-[600px] mx-auto pt-[50px] px-4 overflow-y-scroll h-full pb-[200px] relative">
                <OnboardingHeader text="Set up your profile to get started!" />
                {isLoading && (
                    <div className="absolute top-0 left-0 w-full h-full z-[10000] flex flex-col items-center justify-center bg-white bg-opacity-70 backdrop-blur-[3px]">
                        <IonSpinner color="dark" />
                        <span className="text-grayscale-900 flex items-center justify-center w-full">
                            Joining Network...
                        </span>
                    </div>
                )}

                <section className={`pt-[36px] pb-[16px] ${containerClassName}`}>
                    <IonRow class="w-full">
                        <IonCol size="12" className="flex items-center justify-center">
                            <div className="bg-grayscale-100/40 relative m-0 flex items-center justify-between rounded-[40px] object-fill p-0 pb-[3px] pr-[10px] pt-[3px]">
                                <ProfilePicture
                                    customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[70px] min-h-[70px]"
                                    customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[70px] min-h-[70px]"
                                    customSize={500}
                                    overrideSrc={photo?.length > 0}
                                    overrideSrcURL={photo}
                                >
                                    {imageUploadLoading && (
                                        <div className="user-image-upload-inprogress absolute flex h-[70px] min-h-[70px] w-[70px] min-w-[70px] items-center justify-center overflow-hidden rounded-full border-2 border-solid border-white text-xl font-medium text-white">
                                            <IonSpinner
                                                name="crescent"
                                                color="dark"
                                                className="scale-[1.75]"
                                            />
                                        </div>
                                    )}
                                </ProfilePicture>
                                <button
                                    onClick={handleImageSelect}
                                    type="button"
                                    className="text-grayscale-900 ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
                                >
                                    <Pencil className="h-[60%]" />
                                </button>
                            </div>
                        </IonCol>
                    </IonRow>

                    <div className="flex flex-col items-center justify-center w-full px-4 mt-4">
                        <div className="w-full flex items-center justify-center mb-4">
                            <OnboardingRoleItem
                                role={role}
                                roleItem={
                                    LearnCardRoles?.find(r => r.type === role) as LearnCardRoleType
                                }
                                setRole={() => {}}
                                handleEdit={() => setStep?.(OnboardingStepsEnum.selectRole)}
                                showDescription={false}
                            />
                        </div>

                        <IonRow className="flex flex-col items-center justify-center w-full">
                            {lcNetworkProfile && lcNetworkProfile?.profileId && (
                                <IonInput
                                    autocapitalize="on"
                                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-wider text-base mb-4`}
                                    value={`@${lcNetworkProfile?.profileId}`}
                                    placeholder="User ID"
                                    type="text"
                                    aria-label="User ID"
                                    readonly
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
                                    placeholder="Full Name"
                                    type="text"
                                    aria-label="Full Name"
                                />
                                {errors.name && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            {/* <div className="flex flex-col items-center justify-center w-full">
                            <button
                                    className={`w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] py-[16px] tracking-wider text-base ${errors?.dob ? 'login-input-email-error' : ''
                                        }`}
                                    onClick={() => {
                                        newModal(
                                            <div className="w-full h-full transparent flex items-center justify-center">
                                                <IonDatetime
                                                    onIonChange={e => {
                                                        setErrors({});
                                                        setDob(
                                                            moment(e.detail.value).format(
                                                                'YYYY-MM-DD'
                                                            )
                                                        );
                                                        closeModal();
                                                    }}
                                                    value={
                                                        dob
                                                            ? moment(dob).format('YYYY-MM-DD')
                                                            : null
                                                    }
                                                    id="datetime"
                                                    presentation="date"
                                                    className="bg-white text-black rounded-[20px] shadow-3xl z-50 font-notoSans"
                                                    showDefaultButtons
                                                    color="indigo-500"
                                                    max={moment().format('YYYY-MM-DD')}
                                                    min="1900-01-01"
                                                    onIonCancel={closeModal}
                                                />
                                            </div>,
                                            {
                                                sectionClassName:
                                                    '!bg-transparent !border-none !shadow-none !rounded-none',
                                            },
                                            {
                                                desktop: ModalTypes.Center,
                                                mobile: ModalTypes.Center,
                                            }
                                        );
                                    }}
                                >
                                    {dob ? moment(dob).format('MMMM Do, YYYY') : 'Date of Birth'}
                                    <Calendar className="w-[30px] text-grayscale-700" />
                                </button> */}

                            {/* {errors?.dob && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                                        {errors?.dob}
                                    </p>
                                )} */}
                            {/* </div> */}
                        </IonRow>

                        {networkToggle && !lcNetworkProfile && (
                            <IonRow className="flex flex-col items-center justify-center w-full mt-4">
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
                                            placeholder="User ID"
                                            aria-label="User ID"
                                            type="text"
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
                            </IonRow>
                        )}
                    </div>
                </section>

                <p className="text-center text-sm font-normal px-16 text-grayscale-600 mt-4">
                    You own your own data.
                    <br />
                    All connections are encrypted.
                </p>
            </div>
            <OnboardingFooter
                step={step}
                role={role}
                setStep={setStep}
                text={isLoading ? 'Loading...' : 'Continue'}
                onClick={handleClick}
                showBackButton
                showCloseButton={!!lcNetworkProfile?.profileId}
            />
        </div>
    );
};

export default OnboardingNetworkForm;
