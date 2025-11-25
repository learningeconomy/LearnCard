import React, { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import {
    IonContent,
    IonFooter,
    IonInput,
    IonPage,
    IonSpinner,
    IonToolbar,
    useIonModal,
} from '@ionic/react';
import Pencil from '../../../svgs/Pencil';
import LearnCardIconOutline from '../../../svgs/LearnCardIconOutline';
import LearnCardIDCMS from '../../../learncardID-CMS/LearnCardIDCMS';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import X from '../../../svgs/X';

import { ModalTypes, UploadRes, useFilestack, useModal, UserProfilePicture } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { FamilyChildAccount, FamilyCMSAppearance } from '../../familyCMSState';
import { LearnCardIDCMSTabsEnum } from '../../../learncardID-CMS/LearnCardIDCMSTabs';
import { getLearnCardIDStyleDefaults } from '../../../learncardID-CMS/learncard-cms.helpers';

import keyboardStore from 'learn-card-base/stores/keyboardStore';

export enum ChildInviteModalViewModeEnum {
    create = 'create',
    edit = 'edit',
}

type ChildInviteModalProps = {
    viewMode?: ChildInviteModalViewModeEnum;
    existingChild?: FamilyChildAccount;
    familyName?: string;
    handleSaveChildAccount?: (childAccount: FamilyChildAccount) => void;
    handleUpdateChildAccount?: (name: string, updatedUser: FamilyChildAccount) => void;
    handleCloseModal?: () => void;
    handleDeleteUser?: (key: string, profileId: string) => void;
};

const StateValidator = z.object({
    name: z.string().min(1, 'Name is required!'),
});

export const ChildInviteModal: React.FC<ChildInviteModalProps> = ({
    viewMode = ChildInviteModalViewModeEnum.create,
    existingChild,
    familyName,
    handleSaveChildAccount,
    handleUpdateChildAccount,
    handleCloseModal,
    handleDeleteUser,
}) => {
    const { newModal, closeModal } = useModal();
    const bottomBarRef = useRef<HTMLDivElement>();
    const isInEditMode = ChildInviteModalViewModeEnum.edit === viewMode;

    const [name, setName] = useState<string | null | undefined>(
        isInEditMode ? existingChild?.name : ''
    );
    const [shortBio, setShortBio] = useState<string | null | undefined>(
        isInEditMode ? existingChild?.shortBio : ''
    );
    const [image, setImage] = useState<string | null | undefined>(
        isInEditMode ? existingChild?.image : ''
    );
    const [learnCardID, setLearnCardID] = useState<FamilyCMSAppearance>(
        isInEditMode
            ? existingChild?.learnCardID
            : getLearnCardIDStyleDefaults(LearnCardIDCMSTabsEnum.dark)
    );

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

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

    const handleSave = () => {
        if (validate()) {
            handleSaveChildAccount?.({
                name: name ?? '',
                shortBio: shortBio ?? '',
                image: image ?? '',
                profileId: uuidv4(),
                learnCardID,
            });
            handleCloseModal?.();
            return;
        }
    };

    const handleSaveEdits = () => {
        if (isInEditMode && validate()) {
            handleUpdateChildAccount?.(existingChild?.name, {
                name: name ?? '',
                shortBio: shortBio ?? '',
                image: image ?? '',
                learnCardID,
            });
            handleCloseModal?.();
            return;
        }
    };

    const onHandleDeleteUser = () => {
        handleDeleteUser?.('issueTo', existingChild?.name);
        handleCloseModal?.();
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
        <IonPage>
            <IonContent fullscreen color="grayscale-200">
                <div className="w-full flex flex-col items-center justify-center ion-padding mt-8 safe-area-top-margin">
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
                                Child in {familyName}
                            </p>
                        </div>

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

                    {/* hide for mvp */}
                    {/* {viewMode !== ChildInviteModalViewModeEnum.create && (
                        <div className="flex items-center justify-center w-full max-w-[600px]">
                            <button
                                onClick={onHandleDeleteUser}
                                className="bg-white font-poppins text-red-600 text-[17px] font-semibold rounded-full py-[12px] w-full hadow-soft-bottom flex items-center justify-center mt-4"
                            >
                                <TrashBin version="2" className="mr-2" strokeWidth="2" /> Delete
                                Account
                            </button>
                        </div>
                    )} */}
                </div>
            </IonContent>
            <IonFooter
                ref={bottomBarRef}
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-[15px] absolute bottom-0 bg-white !max-h-[85px]"
            >
                <IonToolbar mode="ios">
                    <div className="w-full flex items-center justify-center">
                        <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                            <button
                                onClick={handleCloseModal}
                                className="bg-white font-poppins text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                            >
                                Cancel
                            </button>
                            {isInEditMode ? (
                                <button
                                    onClick={handleSaveEdits}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleSaveEdits();
                                        }
                                    }}
                                    className="text-white font-poppins text-lg font-semibold rounded-full py-[12px] w-full bg-emerald-700"
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleSave();
                                        }
                                    }}
                                    onClick={handleSave}
                                    className="text-white font-poppins text-lg font-semibold rounded-full py-[12px] w-full bg-emerald-700"
                                >
                                    Create
                                </button>
                            )}
                        </div>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default ChildInviteModal;
