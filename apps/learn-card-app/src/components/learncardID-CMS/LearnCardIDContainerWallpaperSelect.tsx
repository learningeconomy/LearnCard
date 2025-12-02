import React, { useEffect, useState } from 'react';

import { IonSpinner } from '@ionic/react';
import Pencil from '../svgs/Pencil';
import TrashBin from '../svgs/TrashBin';
import EmptyImage from '../../assets/images/wallpaper-empty-state.png';

import { UploadRes, useFilestack } from 'learn-card-base';

import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

export const LearnCardIDContainerWallpaperSelect: React.FC<{
    backgroundImage?: string;
    handleSetState: (key: string, value: any) => void;
}> = ({ backgroundImage, handleSetState }) => {
    const [wallpaper, setWallpaper] = useState<string>(backgroundImage ?? '');

    useEffect(() => {
        if (backgroundImage) {
            setWallpaper(backgroundImage);
        }
    }, [backgroundImage]);

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const handleDeleteImageUploaded = () => {
        setWallpaper('');
        handleSetState('backgroundImage', '');
    };

    const onUpload = (data: UploadRes) => {
        setWallpaper(data?.url);
        handleSetState('backgroundImage', data?.url);
        setUploadProgress(false);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    return (
        <div className="flex items-center justify-between w-full bg-grayscale-100 p-2 pb-4 pl-[10px] border-b-white border-b-solid border-b-[2px] rounded-tl-[20px] rounded-tr-[20px] mt-4">
            <div className="flex items-center justify-start w-[70%] overflow-hidden">
                <div
                    className={`relative flex items-center justify-center object-contain overflow-hidden w-[50px] h-[50px] bg-grayscale-300 rounded-[10px] border-solid border-white border-[1px]`}
                >
                    {!wallpaper ? (
                        <div className="p-[6px]">
                            <img
                                alt="wallpaper empty state"
                                src={EmptyImage}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <img
                            alt="badge thumbnail"
                            src={wallpaper}
                            className="w-full h-full object-cover"
                        />
                    )}
                    {imageUploadLoading && (
                        <div className="absolute z-50 flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px] user-image-upload-inprogress">
                            <IonSpinner name="crescent" color="dark" className="scale-[1.75]" />
                        </div>
                    )}
                </div>
                {!wallpaper && (
                    <p className="ml-[10px] font-notoSans text-sm font-bold text-grayscale-500">
                        None
                    </p>
                )}
            </div>

            <div className="flex">
                <div className="flex items-center justify-center rounded-full bg-white mr-2 h-[40px] w-[40px] shadow-3xl overflow-hidden">
                    <button onClick={handleImageSelect} className="bg-white overflow-hidden">
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
    );
};

export default LearnCardIDContainerWallpaperSelect;
