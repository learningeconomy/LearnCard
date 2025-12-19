import React, { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { useFilestack, UploadRes, BoostCMSMediaState } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { IonCol, IonRow, IonInput } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import TrashBin from '../../../../svgs/TrashBin';
import { Updater } from 'use-immer';
import { produce } from 'immer';
import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';
import { BoostCMSMediaAttachment } from 'learn-card-base';

type ThumbListItemProps = {
    photoUrl: string;
    handleDelete: () => void;
};

const ThumbListItem: React.FC<ThumbListItemProps> = ({ photoUrl, handleDelete }) => {
    return (
        <div className="flex items-center justify-start w-full mb-4">
            <div
                className={`relative flex items-center justify-center object-contain overflow-hidden w-[72px] h-[72px] bg-grayscale-800 rounded-[10px] shadow-3xl`}
            >
                <img alt="badge thumbnail" src={photoUrl} className="h-full w-full object-cover" />
                <button
                    onClick={handleDelete}
                    className="absolute flex items-center justify-center right-1 bottom-1 rounded-full bg-white h-[30px] w-[30px]"
                >
                    <TrashBin className="text-grayscale-800 h-[20px] w-[20px]" />
                </button>
            </div>
        </div>
    );
};

const BoostCMSMediaPhotoUpload: React.FC<{
    state: BoostCMSMediaState;
    setState: Updater<BoostCMSMediaAttachment[]>;
    activeMediaType: BoostMediaOptionsEnum | null;
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
    handleCloseModal?: () => void;
    setUploadedPhotos: React.Dispatch<React.SetStateAction<BoostCMSMediaAttachment[]>>;
    handleSave: () => void;
    uploadedPhotos: BoostCMSMediaAttachment[];
    initialIndex?: number;
    hideBackButton?: boolean;
}> = ({
    state,
    setState,
    activeMediaType,
    setActiveMediaType,
    handleCloseModal,
    uploadedPhotos,
    handleSave,
    initialIndex,
    hideBackButton,
}) => {
    const { id, type, title, color, Icon } = boostMediaOptions.find(
        ({ type }) => type === activeMediaType
    );

    const [newPhotoTitle, setNewPhotoTitle] = useState<string>();
    const [currentIndex, setCurrentIndex] = useState<number>(initialIndex || 0);
    const [newPhotoUrl, setNewPhotoUrl] = useState<string>();

    const onUpload = (data: UploadRes) => {
        // setUploadProgress(false);
        // setNewPhotoUrl(data?.url);
        setState(
            produce(state.photos, draft => {
                draft[currentIndex].url = data?.url;
            })
        );
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        // options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const photoSrc = state?.photos?.[currentIndex]?.url;

    return (
        <>
            <IonRow className="flex flex-col pb-4">
                <IonCol className="w-full flex items-center justify-between mt-8 mb-2">
                    <h6 className="flex items-center justify-center font-medium text-grayscale-800 text-2xl font-notoSans">
                        {!hideBackButton && (
                            <button
                                className="text-grayscale-50 p-0 mr-[10px]"
                                onClick={() => setActiveMediaType(null)}
                            >
                                <CaretLeft className="h-auto w-3 text-grayscale-800" />
                            </button>
                        )}
                        {title}
                    </h6>
                    <Icon className={`text-${color} h-[40px] max-h-[40px] max-w-[40px]`} />
                </IonCol>
            </IonRow>
            <div className="flex flex-col items-center justify-center w-full mb-4">
                <div className="image-preview max-h-[250px] mb-[20px]">
                    <img
                        alt="Uploaded Image Preview"
                        className="max-h-[250px]"
                        src={photoSrc}
                        onClick={handleImageSelect}
                        referrerPolicy="no-referrer"
                    />
                </div>

                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base font-notoSans`}
                    placeholder="Title"
                    type="text"
                    value={state.photos?.[currentIndex]?.title}
                    onIonInput={e => {
                        let stateCopy = structuredClone(state.photos);
                        if (stateCopy[currentIndex]) {
                            stateCopy[currentIndex].title = e.detail.value as string;
                            setState(stateCopy);
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') Keyboard.hide();
                    }}
                />
            </div>
            {/* {state?.photos && state.photos?.map(photo => {
                return <ThumbListItem  photoUrl={photo.url} handleDelete={()=>console.log('///delete item')}/>
            })} */}
            {!imageUploadLoading ? (
                <button
                    onClick={() => {
                        handleSave();
                    }}
                    className={`flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-notoSans`}
                >
                    Save
                </button>
            ) : (
                <button className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-notoSans">
                    {imageUploadLoading ? 'Uploading...' : 'Upload'}
                </button>
            )}

            {photoSrc && (
                <button
                    onClick={handleImageSelect}
                    className="flex items-center mt-[20px] justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-notoSans"
                >
                    Change Photo
                </button>
            )}
            <div className="w-full flex items-center justify-center mt-[20px]">
                <button
                    onClick={() => {
                        if (!hideBackButton) {
                            setState([]);
                            setActiveMediaType(null);
                        }
                        handleCloseModal?.();
                    }}
                    className="text-grayscale-900 text-center text-sm font-notoSans"
                >
                    Cancel
                </button>
            </div>
        </>
    );
};

export default BoostCMSMediaPhotoUpload;
