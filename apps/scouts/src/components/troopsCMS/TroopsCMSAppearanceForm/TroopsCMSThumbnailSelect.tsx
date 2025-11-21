import React, { useEffect, useState } from 'react';

import { IonSpinner } from '@ionic/react';
import Pencil from '../../svgs/Pencil';
import TrashBin from '../../svgs/TrashBin';

import { UploadRes, useFilestack } from 'learn-card-base';
import { TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { getDefaultBadgeThumbForViewMode } from '../../../helpers/troop.helpers';
import { insertParamsToFilestackUrl } from 'learn-card-base';

export const TroopCMSThumbnailSelect: React.FC<{
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
    const badgeThumbnail = isInIDMode ? appearance?.idThumbnail : appearance?.badgeThumbnail;

    const parentAppearance = state?.parentID?.appearance;

    const [thumbnail, setThumbnail] = useState<string>(badgeThumbnail ?? '');

    useEffect(() => {
        setThumbnail(badgeThumbnail ?? '');
    }, [badgeThumbnail]);

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
        setThumbnail('');
        if (isInIDMode) {
            handleStateChange('idThumbnail', '');
            return;
        }

        handleStateChange('badgeThumbnail', '');
        // handleStateChange('idIssuerThumbnail', '');
    };

    const onUpload = (data: UploadRes) => {
        setThumbnail(data?.url);
        setUploadProgress(false);

        if (isInIDMode) {
            handleStateChange('idThumbnail', data?.url);
            return;
        }

        handleStateChange('badgeThumbnail', data?.url);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const title = isInIDMode ? '' : 'Thumbnail';

    return (
        <>
            <div
                className={`flex flex-col items-center justify-center bg-white rounded-[20px] w-full mb-[20px] mt-2 ${className}`}
            >
                <h3 className="text-grayscale-700 font-notoSans font-normal text-left w-full text-[20px]">
                    {title}
                </h3>

                <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-[15px] mt-4 p-2">
                    <div className="flex items-center justify-start w-[70%] overflow-hidden">
                        <div
                            className={`relative flex items-center justify-center object-contain overflow-hidden w-[50px] h-[50px] bg-grayscale-300 rounded-full border-solid border-white border-[1px]`}
                        >
                            {(!thumbnail && !state?.inheritNetworkStyles && !isInIDMode) ||
                            (!thumbnail && isInIDMode) ? (
                                getDefaultBadgeThumbForViewMode(viewMode)
                            ) : (
                                <img
                                    alt="badge thumbnail"
                                    src={
                                        state?.inheritNetworkStyles && !isInIDMode
                                            ? insertParamsToFilestackUrl(
                                                  parentAppearance?.badgeThumbnail,
                                                  'resize=width:200/quality=value:75/'
                                              )
                                            : insertParamsToFilestackUrl(
                                                  thumbnail,
                                                  'resize=width:200/quality=value:75/'
                                              )
                                    }
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
                        {(!thumbnail && !state?.inheritNetworkStyles && !isInIDMode) ||
                            (!thumbnail && isInIDMode && (
                                <p className="ml-[10px] font-notoSans text-sm font-bold text-grayscale-500">
                                    None
                                </p>
                            ))}
                    </div>

                    {!disabled && (
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
                    )}
                </div>
            </div>
        </>
    );
};

export default TroopCMSThumbnailSelect;
