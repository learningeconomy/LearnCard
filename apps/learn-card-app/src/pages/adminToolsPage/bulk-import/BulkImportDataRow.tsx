import React from 'react';

import X from 'learn-card-base/svgs/X';
import Checkmark from '../../../components/svgs/Checkmark';
import WarningIcon from '../../../components/svgs/WarningIcon';

import {
    extractFilename,
    DataKeys,
    ImageStatus,
    BadgeDataRow,
    ImageTrackingInfo,
} from './BulkBoostImportPage';
import { isValidUrl, truncateWithEllipsis } from 'learn-card-base';

type BulkImportDataRowProps = {
    row: BadgeDataRow;
    rowTracking: Map<string, ImageTrackingInfo>;
    handlePreview: () => void;
    handleDeleteRow: () => void;
};

const BulkImportDataRow: React.FC<BulkImportDataRowProps> = ({
    row,
    rowTracking,
    handlePreview,
    handleDeleteRow,
}) => {
    const mainImageInfo = rowTracking.get(DataKeys.image) || {
        status: ImageStatus.validUrl,
        originalValue: '',
    };
    const bgImageInfo = rowTracking.get(DataKeys.backgroundImage) || {
        status: ImageStatus.validUrl,
        originalValue: '',
    };

    const mainImageValue =
        mainImageInfo.status === ImageStatus.uploaded
            ? mainImageInfo.uploadedUrl
            : row[DataKeys.image];

    const bgImageValue =
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
                return <Checkmark className="h-4 w-4 text-green-600" />;
            case ImageStatus.uploaded:
                return <Checkmark className="h-4 w-4 text-green-600" />;
            case ImageStatus.needsUpload:
                return <WarningIcon className="h-4 w-4 text-amber-500" />;
            case ImageStatus.missing:
                return <X className="h-4 w-4 text-red-600" />;
            default:
                return null;
        }
    };

    const statusToDisplayText = {
        [ImageStatus.validUrl]: 'Valid URL',
        [ImageStatus.uploaded]: 'Uploaded',
        [ImageStatus.needsUpload]: 'Needs Upload',
        [ImageStatus.missing]: 'Missing',
    };

    return (
        <tr className={hasMissingImages ? 'hover:bg-red-100' : ''}>
            <td className="border px-2 py-2">
                <div className="flex flex-col gap-[5px] items-center justify-center">
                    <button
                        onClick={handlePreview}
                        className="shadow-box-bottom px-[5px] py-[2px] rounded-full"
                    >
                        Preview
                    </button>
                    <button
                        onClick={handleDeleteRow}
                        className="shadow-box-bottom px-[5px] py-[2px] rounded-full"
                    >
                        Delete
                    </button>
                </div>
            </td>
            <td className="border px-2 py-2">{row[DataKeys.title]}</td>
            <td className="border px-2 py-2">{row[DataKeys.category]}</td>
            <td className="border px-2 py-2">{row[DataKeys.badgeType]}</td>

            {/* Badge Image Column */}
            <td className="border px-2 py-2">
                <div className="flex flex-col gap-1">
                    {mainImageValue && (
                        <>
                            {isValidUrl(mainImageValue) ? (
                                <img
                                    src={mainImageValue}
                                    alt="Badge"
                                    className="h-[100px] w-[100px] object-contain"
                                />
                            ) : (
                                <div className="h-[100px] w-[100px] bg-gray-100 text-gray-500 text-xs relative overflow-y-hidden">
                                    <span className="absolute top-1/2 left-0 right-0 text-center -translate-y-1/2 px-1">
                                        {extractFilename(mainImageValue)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                {getImageStatusIcon(mainImageInfo.status)}
                                <span className="text-sm">
                                    {statusToDisplayText[mainImageInfo.status]}
                                </span>
                            </div>
                        </>
                    )}
                    {!mainImageValue && (
                        <div className="h-[100px] w-[100px] flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
                            [none]
                        </div>
                    )}
                </div>
            </td>

            {/* Background Image Column */}
            <td className="border px-2 py-2">
                <div className="flex flex-col gap-1">
                    {bgImageValue && (
                        <>
                            {isValidUrl(bgImageValue) ? (
                                <img
                                    src={bgImageValue}
                                    alt="Background"
                                    className="h-[100px] w-[100px] object-contain"
                                />
                            ) : (
                                <div className="h-[100px] w-[100px] bg-gray-100 text-gray-500 text-xs relative overflow-y-hidden">
                                    <span className="absolute top-1/2 left-0 right-0 text-center -translate-y-1/2 px-1">
                                        {extractFilename(bgImageValue)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                {getImageStatusIcon(bgImageInfo.status)}
                                <span className="text-sm">
                                    {statusToDisplayText[bgImageInfo.status]}
                                </span>
                            </div>
                        </>
                    )}
                    {!bgImageValue && (
                        <div className="h-[100px] w-[100px] flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
                            [none]
                        </div>
                    )}
                </div>
            </td>

            <td className="border px-2 py-2">
                {truncateWithEllipsis(row[DataKeys.description], 70)}
            </td>
            <td className="border px-2 py-2">{truncateWithEllipsis(row[DataKeys.criteria], 70)}</td>
            <td className="border px-2 py-2">{row[DataKeys.displayType]}</td>
            <td className="border px-2 py-2">{row[DataKeys.backgroundColor]}</td>
            <td className="border px-2 py-2">{row[DataKeys.skills]}</td>
        </tr>
    );
};

export default BulkImportDataRow;
