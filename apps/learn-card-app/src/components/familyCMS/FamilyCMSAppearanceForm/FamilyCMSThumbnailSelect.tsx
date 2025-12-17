import React, { useState } from 'react';

import { IonSpinner } from '@ionic/react';
import Pencil from '../../svgs/Pencil';
import TrashBin from '../../svgs/TrashBin';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';

import { UploadRes, useFilestack } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { DEFAULT_FAMILY_THUMBNAIL, FamilyCMSState } from '../familyCMSState';

export const FamilyCMSThumbnailSelect: React.FC<{
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
}> = ({ state, setState }) => {
    const [thumbnail, setThumbnail] = useState<string>(state?.appearance?.badgeThumbnail ?? '');

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const handleSetState = (value: string) => {
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState?.appearance,
                    badgeThumbnail: value,
                },
            };
        });
    };

    const handleDeleteImageUploaded = () => {
        setThumbnail(DEFAULT_FAMILY_THUMBNAIL);
        handleSetState(DEFAULT_FAMILY_THUMBNAIL);
    };

    const onUpload = (data: UploadRes) => {
        setThumbnail(data?.url);
        handleSetState(data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const title = 'Thumbnail';

    return (
        <>
            <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full mb-[20px] mt-4">
                <h3 className="text-grayscale-900 font-poppins font-normal text-left w-full text-[20px]">
                    {title}
                </h3>

                <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-[15px] mt-4 p-2">
                    <div className="flex items-center justify-start w-[70%] overflow-hidden">
                        <div
                            className={`relative flex items-center justify-center object-contain overflow-hidden w-[50px] h-[50px] bg-grayscale-300 rounded-full border-solid border-white border-[1px]`}
                        >
                            {!thumbnail ? (
                                <div className="flex items-center justify-center p-[6px] rounded-full overflow-hidden">
                                    <img
                                        alt="badge thumbnail"
                                        src={EmptyImage}
                                        className="w-full h-full object-cover p-1"
                                    />
                                </div>
                            ) : (
                                <img
                                    alt="badge thumbnail"
                                    src={thumbnail}
                                    className="w-full h-full object-cover bg-white"
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
                        </div>
                        {!thumbnail && (
                            <p className="ml-[10px] font-poppins text-sm font-bold text-grayscale-500">
                                None
                            </p>
                        )}
                    </div>

                    <div className="flex">
                        <div className="flex items-center justify-center rounded-full bg-white mr-2 h-[40px] w-[40px] shadow-3xl overflow-hidden">
                            <button
                                onClick={handleImageSelect}
                                className="bg-white overflow-hidden"
                            >
                                <Pencil className="text-blue-950 h-[30px] w-[30px]" />
                            </button>
                        </div>
                        <div className="flex items-center justify-center rounded-full bg-white mr-2 h-[40px] w-[40px] shadow-3xl overflow-hidden">
                            <button
                                onClick={handleDeleteImageUploaded}
                                className="bg-white overflow-hidden"
                            >
                                <TrashBin className="text-blue-950 h-[30px] w-[30px]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FamilyCMSThumbnailSelect;
