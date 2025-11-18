import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import AdminToolsFamilySelectorButton from '../../../../pages/adminToolsPage/AdminToolsAccountSwitcher/AdminToolsFamilySelectorButton';
import LearnCardIconOutline from '../../../svgs/LearnCardIconOutline';
import LearnCardIDCMS from '../../../learncardID-CMS/LearnCardIDCMS';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import { IonInput, IonSpinner } from '@ionic/react';
import Pencil from '../../../svgs/Pencil';
import X from '../../../svgs/X';

import {
    ModalTypes,
    UploadRes,
    useFilestack,
    useModal,
    UserProfilePicture,
    useGetCredentials,
    CredentialCategoryEnum,
    useToast,
} from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { FamilyCMSAppearance } from '../../familyCMSState';
import { LearnCardIDCMSTabsEnum } from '../../../learncardID-CMS/LearnCardIDCMSTabs';
import { getLearnCardIDStyleDefaults } from '../../../learncardID-CMS/learncard-cms.helpers';

import { useCreateChildAccount } from '../../../../hooks/useCreateChildAccount';

type ChildInviteModalSimpleProps = {
    selectedFamily:
        | {
              name: string;
              picture: string;
              uri: string;
          }
        | undefined;
    setSelectedFamily: React.Dispatch<
        React.SetStateAction<
            | {
                  name: string;
                  picture: string;
                  uri: string;
              }
            | undefined
        >
    >;
};

const StateValidator = z.object({
    name: z.string().min(1, 'Name is required!'),
});

export const ChildInviteModalSimple: React.FC<ChildInviteModalSimpleProps> = ({
    selectedFamily,
    setSelectedFamily,
}) => {
    const { newModal, closeModal } = useModal();
    const { presentToast } = useToast();

    const { mutate: createChildAccount } = useCreateChildAccount();

    const [name, setName] = useState<string | null | undefined>('');
    const [shortBio, setShortBio] = useState<string | null | undefined>('');
    const [image, setImage] = useState<string | null | undefined>('');
    const [learnCardID, setLearnCardID] = useState<FamilyCMSAppearance>(
        getLearnCardIDStyleDefaults(LearnCardIDCMSTabsEnum.dark)
    );

    const [isLoading, setIsLoading] = useState(false);

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const { data: families } = useGetCredentials(CredentialCategoryEnum.family);

    const onUpload = (data: UploadRes) => {
        setImage(data?.url);
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
                presentToast(`Failed to create "${name}": ${e?.message}`);
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSaveLearnCardID = (learnCardIDUpdates: FamilyCMSAppearance) => {
        setLearnCardID(prevState => {
            return {
                ...prevState,
                ...learnCardIDUpdates,
            };
        });
    };

    const presentLearCardID = () => {
        newModal(
            <LearnCardIDCMS
                learnCardID={learnCardID}
                user={{
                    name,
                    shortBio: shortBio,
                    image: image,
                }}
                handleCloseModal={closeModal}
                handleSaveLearnCardID={handleSaveLearnCardID}
            />,
            {},
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
        );
    };

    return (
        <>
            <div className="w-full flex flex-col items-center justify-center ion-padding mt-8">
                <div className="flex flex-col items-center justify-center w-full max-w-[400px] shadow-sm rounded-[15px] bg-white px-4 pt-6 pb-10">
                    <div>
                        <p className="text-grayscale-900 font-poppins m-0 flex h-full w-full items-center justify-center text-center text-xl">
                            Child Account
                        </p>
                    </div>
                    <div className="flex items-center justify-center my-4">
                        <div className="bg-grayscale-100/40 relative m-0 flex items-center justify-between rounded-[40px] object-fill p-0 pb-[3px] pr-[10px] pt-[3px]">
                            <UserProfilePicture
                                customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[70px] min-h-[70px]"
                                customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[70px] min-h-[70px]"
                                customSize={500}
                                user={{
                                    name: name,
                                    image: image,
                                }}
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
                            </UserProfilePicture>
                            <div
                                onClick={handleImageSelect}
                                className="text-grayscale-900 ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
                            >
                                <Pencil className="h-[60%]" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-grayscale-600 font-poppins m-0 flex h-full w-full items-center justify-center text-center text-sm font-semibold">
                            Child in {selectedFamily?.name}
                        </p>
                    </div>

                    <AdminToolsFamilySelectorButton
                        setSelectedFamily={setSelectedFamily}
                        families={families}
                        selectedFamily={selectedFamily}
                    />

                    <div className="w-full mb-2 mt-4 relative">
                        <IonInput
                            value={name}
                            onIonInput={e => {
                                const _name = e?.detail?.value;
                                setName(_name);
                                setErrors?.({});
                            }}
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] !px-4 !pb-2 !pr-8 font-normal font-poppins text-sm w-full troops-cms-placeholder ${
                                errors?.name ? 'border-red-300 border-2' : ''
                            }`}
                            label="Name"
                            labelPlacement="stacked"
                            type="text"
                        />

                        {name?.length > 0 && (
                            <button
                                onClick={() => {
                                    setName('');
                                }}
                                className="absolute top-[35%] right-[3%] z-10 pl-2"
                            >
                                <X className="text-grayscale-900 h-[20px] w-[20px]" />
                            </button>
                        )}

                        {errors?.name && (
                            <div className="text-red-400 text-sm font-medium pl-1 mt-1">
                                {errors?.name}
                            </div>
                        )}
                    </div>

                    <div className="w-full mb-2 mt-2 relative">
                        <IonInput
                            value={shortBio}
                            onIonInput={e => {
                                const _shortBio = e?.detail?.value;
                                setShortBio(_shortBio);
                                setErrors?.({});
                            }}
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] !px-4 !pb-2 font-normal font-poppins text-sm w-full troops-cms-placeholder ${
                                errors?.shortBio ? 'border-red-300 border-2' : ''
                            }`}
                            label="Tagline"
                            labelPlacement="stacked"
                            type="text"
                        />

                        {shortBio?.length > 0 && (
                            <button
                                onClick={() => {
                                    setShortBio('');
                                }}
                                className="absolute top-[35%] right-[3%] z-10 pl-2"
                            >
                                <X className="text-grayscale-900 h-[20px] w-[20px]" />
                            </button>
                        )}
                    </div>

                    <div className="w-full h-[2px] bg-grayscale-100 mt-2" />

                    <button
                        onClick={() => presentLearCardID()}
                        className="w-full text-grayscale-900 text-xl font-poppins flex items-center justify-between px-2 mt-4"
                    >
                        <div className="flex">
                            <LearnCardIconOutline className="mr-2" /> Edit LearnCard
                        </div>

                        <SlimCaretRight className="text-grayscale-400 w-[22px] h-auto" />
                    </button>
                </div>
            </div>

            <div className="w-full flex items-center justify-center gap-4 px-4">
                <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-full bg-white text-grayscale-800 py-2 shadow-sm"
                >
                    Close
                </button>
                <button
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            handleCreateChildAccount();
                        }
                    }}
                    onClick={handleCreateChildAccount}
                    disabled={isLoading}
                    className="flex-1 rounded-full text-white py-2 shadow-sm bg-emerald-700"
                >
                    {isLoading ? 'Creating...' : 'Create'}
                </button>
            </div>
        </>
    );
};

export default ChildInviteModalSimple;
