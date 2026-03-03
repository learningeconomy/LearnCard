import React from 'react';
import moment from 'moment';

import X from 'learn-card-base/svgs/X';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import WarningIcon from '../../../../components/svgs/WarningIcon';

import { useCurrentUser, useModal, useGetCurrentLCNUser } from 'learn-card-base';
import {
    BadgeDataRow,
    DataKeys,
    ImageTrackingType,
    ImageStatus,
    ImageTrackingInfo,
} from '../AdminToolsBulkBoostImportOption';
import BlueCheckMark from 'apps/learn-card-app/src/components/svgs/BlueCheckMark';

const BulkBoostPreviewItem: React.FC<{
    index: number;
    row: BadgeDataRow;
    imageTracking: ImageTrackingType;
    handleDeleteRow: (rowIndex: number) => void;
    handlePreview: (csvRow: BadgeDataRow) => void;
}> = ({ index, row, imageTracking, handleDeleteRow, handlePreview }) => {
    const { closeModal } = useModal();
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const rowTracking = imageTracking.get(index) || new Map();

    const onDeleteRow = (rowIndex: number) => {
        handleDeleteRow(rowIndex);
    };

    const title = row[DataKeys.title];
    const description = row[DataKeys.description];
    const image = row[DataKeys.image];

    const mainImageInfo: ImageTrackingInfo = rowTracking.get(DataKeys.image) || {
        status: ImageStatus.validUrl,
        originalValue: '',
    };
    const bgImageInfo: ImageTrackingInfo = rowTracking.get(DataKeys.backgroundImage) || {
        status: ImageStatus.validUrl,
        originalValue: '',
    };

    const mainImageValue: string | undefined =
        mainImageInfo.status === ImageStatus.uploaded
            ? mainImageInfo.uploadedUrl
            : row[DataKeys.image];

    const bgImageValue: string | undefined =
        bgImageInfo.status === ImageStatus.uploaded
            ? bgImageInfo.uploadedUrl
            : row[DataKeys.backgroundImage];

    let hasMissingImages = false;
    for (const imageColumn of rowTracking.values()) {
        hasMissingImages =
            hasMissingImages ||
            imageColumn.status === ImageStatus.needsUpload ||
            imageColumn.status === ImageStatus.missing;
    }

    // Helper to get image status icon
    const getImageStatusIcon = (status: ImageStatus) => {
        switch (status) {
            case ImageStatus.validUrl:
                return <Checkmark className="h-6 w-6 text-green-600" />;
            case ImageStatus.uploaded:
                return <Checkmark className="h-6 w-6 text-green-600" />;
            case ImageStatus.needsUpload:
                return <WarningIcon className="h-6 w-6 text-amber-500" />;
            case ImageStatus.missing:
                return <X className="h-6 w-6 text-red-600" />;
            default:
                return null;
        }
    };

    const statusToDisplayText = {
        [ImageStatus.validUrl]: 'Valid URL',
        [ImageStatus.uploaded]: 'Uploaded',
        [ImageStatus.needsUpload]: 'Needs Image Upload!',
        [ImageStatus.missing]: 'Missing Image!',
    };

    return (
        <div
            role="button"
            onClick={() => handlePreview(row)}
            className={`flex items-center gap-[10px] w-full px-2 py-3 rounded-[15px] bg-white shadow-bottom-2- ${
                hasMissingImages ? 'border-[1px] border-solid border-orange-200' : ''
            }`}
        >
            {mainImageInfo.status === ImageStatus.missing ||
                (mainImageInfo.status === ImageStatus.needsUpload && (
                    <div className="rounded-full h-[40px] w-[40px] min-h-[40px] min-w-[40px] flex items-center justify-center border-[1px] border-solid border-orange-500">
                        {getImageStatusIcon(mainImageInfo.status)}
                    </div>
                ))}

            {(mainImageInfo.status === ImageStatus.uploaded ||
                mainImageInfo.status === ImageStatus.validUrl) && (
                <img
                    src={mainImageValue}
                    alt={title}
                    className="rounded-full object-cover h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                />
            )}

            <div className="flex flex-col font-poppins flex-1">
                <h3 className="text-[16.5px] font-[600] text-grayscale-900 line-clamp-1">
                    {title}
                </h3>
                <p className="text-sm text-grayscale-700 line-clamp-1 flex items-center gap-[5px]">
                    <BlueCheckMark /> {currentLCNUser?.displayName} • {moment().format('MM/DD/YY')}
                </p>
                {mainImageInfo.status === ImageStatus.missing ||
                    (mainImageInfo.status === ImageStatus.needsUpload && (
                        <div className="flex items-center justify-start">
                            <span className="text-xs text-orange-700">
                                {statusToDisplayText?.[mainImageInfo?.status]}
                            </span>
                        </div>
                    ))}
            </div>
            <button
                onClick={e => {
                    e.stopPropagation();
                    onDeleteRow(index);
                }}
                className="ml-auto p-[5px] rounded-full hover:bg-grayscale-50 transition-colors"
            >
                <TrashBin version="thin" className="h-[30px] w-[30px]" />
            </button>
        </div>
    );
};

export default BulkBoostPreviewItem;
