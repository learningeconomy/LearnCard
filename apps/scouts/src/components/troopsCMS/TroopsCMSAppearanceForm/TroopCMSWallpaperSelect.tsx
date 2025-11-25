import React, { useEffect, useState } from 'react';

import { IonSpinner } from '@ionic/react';
import Pencil from '../../svgs/Pencil';
import TrashBin from '../../svgs/TrashBin';
import WallpaperEmptyState from '../../../assets/images/wallpaper-empty-state.png';

import { UploadRes, useFilestack } from 'learn-card-base';
import { TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

export const TroopCMSWallpaperSelect: React.FC<{
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    disabled?: boolean;
    className?: string;
}> = ({ state, setState, viewMode, disabled = false, className }) => {
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;
    const isInIDMode = isInMemberViewMode || isInLeaderViewMode;

    const appearance = isInMemberViewMode ? state?.memberID?.appearance : state?.appearance;
    const backgroundImage = isInIDMode
        ? appearance?.idBackgroundImage
        : appearance?.backgroundImage;

    const parentAppearance = state?.parentID?.appearance;

    const [wallpaper, setWallpaper] = useState<string>(backgroundImage ?? '');

    useEffect(() => {
        setWallpaper(backgroundImage ?? '');
    }, [backgroundImage]);

    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const handleStateChange = (key: string, value: any) => {
        if (isInMemberViewMode) {
            setState(prevState => {
                return {
                    ...prevState,
                    memberID: {
                        ...prevState.memberID,
                        appearance: {
                            ...prevState?.memberID?.appearance,
                            [key]: value,
                        },
                    },
                };
            });
            return;
        }

        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState?.appearance,
                    [key]: value,
                },
            };
        });
    };

    const handleDeleteImageUploaded = () => {
        setWallpaper('');

        if (isInIDMode) {
            handleStateChange('idBackgroundImage', '');
            return;
        }

        handleStateChange('backgroundImage', '');
    };

    const onUpload = (data: UploadRes) => {
        setWallpaper(data?.url);
        setUploadProgress(false);

        if (isInIDMode) {
            handleStateChange('idBackgroundImage', data?.url);
            return;
        }

        handleStateChange('backgroundImage', data?.url);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    return (
        <div
            className={`flex items-center justify-between w-full bg-grayscale-100 p-2 pb-4 pl-[10px] mb-2 border-b-white border-b-solid border-b-[2px] ${className}`}
        >
            <div className="flex items-center justify-start w-[70%] overflow-hidden">
                <div
                    className={`relative flex items-center justify-center object-contain overflow-hidden w-[50px] h-[50px] bg-grayscale-300 rounded-[10px] border-solid border-white border-[1px]`}
                >
                    {(!wallpaper && !state?.inheritNetworkStyles && !isInIDMode) ||
                    (!wallpaper && isInIDMode) ? (
                        <div className="p-[6px]">
                            <img
                                alt="wallpaper empty state"
                                src={WallpaperEmptyState}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <img
                            alt="badge thumbnail"
                            src={
                                state?.inheritNetworkStyles && !isInIDMode
                                    ? parentAppearance?.backgroundImage
                                    : wallpaper
                            }
                            className="w-full h-full object-cover"
                        />
                    )}
                    {imageUploadLoading && (
                        <div className="absolute z-50 flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px] user-image-upload-inprogress">
                            <IonSpinner name="crescent" color="dark" className="scale-[1.75]" />
                        </div>
                    )}
                </div>
                {(!wallpaper && !state?.inheritNetworkStyles && !isInIDMode) ||
                    (!wallpaper && isInIDMode && (
                        <p className="ml-[10px] font-notoSans text-sm font-bold text-grayscale-500">
                            None
                        </p>
                    ))}
            </div>
            {!disabled && (
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
            )}
        </div>
    );
};

export default TroopCMSWallpaperSelect;
