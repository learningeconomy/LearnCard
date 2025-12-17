import React, { useState } from 'react';

import { useFilestack, UploadRes } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { IonRow, IonSpinner, IonToggle } from '@ionic/react';

import Pencil from '../../../../svgs/Pencil';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import TrashBin from '../../../../svgs/TrashBin';

import { BoostCMSState } from '../../../boost';

const BoostIDCardCMSIssuerThumbnailForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const [image, setImage] = useState<string>(state?.appearance?.backgroundImage || '');
    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const handleStateChange = (propName: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState.appearance,
                    [propName]: value,
                },
            };
        });
    };

    const handleDeleteImageUploaded = () => {
        setImage('');
        handleStateChange('idIssuerThumbnail', '');
    };

    const onUpload = (data: UploadRes) => {
        setImage(data?.url);
        setUploadProgress(false);
        handleStateChange('idIssuerThumbnail', data?.url);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-2 mb-4 rounded-[20px]">
            <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                <p className="text-grayscale-900 font-medium w-10/12">Show Issuer Thumbnail</p>
                <IonToggle
                    mode="ios"
                    color="emerald-700"
                    onIonChange={() => {
                        const showIdIssuerImage = !state?.appearance?.showIdIssuerImage;
                        handleStateChange('showIdIssuerImage', showIdIssuerImage);
                    }}
                    checked={state?.appearance?.showIdIssuerImage}
                    disabled={disabled}
                />
            </div>
            <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full font-medium text-lg">
                <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-tl-[50px] rounded-bl-[50px] rounded-tr-[50px] rounded-br-[50px] mt-2">
                    <div className="flex items-center justify-start w-[70%] px-[6px] py-[6px] overflow-hidden">
                        <div
                            className={`relative flex items-center justify-center object-contain overflow-hidden w-[72px] h-[72px] bg-grayscale-800 rounded-full`}
                        >
                            {!state?.appearance?.idIssuerThumbnail ? (
                                <img
                                    alt="badge thumbnail"
                                    src={EmptyImage}
                                    className="w-[43px] h-[47px]"
                                />
                            ) : (
                                <img
                                    alt="badge thumbnail"
                                    src={state?.appearance?.idIssuerThumbnail}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            {imageUploadLoading && (
                                <div className="absolute z-50 flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px] user-image-upload-inprogress">
                                    <IonSpinner
                                        name="crescent"
                                        color="dark"
                                        className="scale-[1.75]"
                                    />
                                </div>
                            )}
                            {state?.appearance?.idIssuerThumbnail && (
                                <button
                                    onClick={handleDeleteImageUploaded}
                                    className="absolute flex items-center justify-center rounded-full bg-white h-[30px] w-[30px] z-50 shadow-3xl"
                                    disabled={disabled}
                                >
                                    <TrashBin className="text-grayscale-800 h-[20px] w-[20px]" />
                                </button>
                            )}
                        </div>
                        {!state?.appearance?.idIssuerThumbnail && (
                            <p className="ml-[10px] text-grayscale-700">Empty</p>
                        )}
                    </div>

                    <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[50px] w-[50px] shadow-3xl">
                        <button
                            disabled={disabled}
                            onClick={handleImageSelect}
                            className="bg-white"
                        >
                            <Pencil className="text-grayscale-900 h-[30px] w-[30px]" />
                        </button>
                    </div>
                </div>
            </div>
        </IonRow>
    );
};

export default BoostIDCardCMSIssuerThumbnailForm;
