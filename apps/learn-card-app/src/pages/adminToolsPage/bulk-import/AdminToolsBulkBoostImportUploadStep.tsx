import React, { useRef } from 'react';

import DocIcon from 'learn-card-base/svgs/DocIcon';
import CsvIcon from 'learn-card-base/svgs/CsvIcon';
import EyeIcon from 'learn-card-base/svgs/EyeIcon';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import BulkImportMissingImagesError from './BulkImportMissingImagesError';
import BulkBoostPreviewModal from './BulkBoostsPreview/BulkBoostPreviewModal';
import CircleCheckOutlineIcon from 'learn-card-base/svgs/CircleCheckOutlineIcon';

import { ModalTypes, useModal } from 'learn-card-base';

import { BadgeDataRow, ImageTrackingType } from './AdminToolsBulkBoostImportOption';
import { IonSpinner } from '@ionic/react';

import { useTheme } from '../../../theme/hooks/useTheme';

export const AdminToolsBulkBoostImportUploadStep: React.FC<{
    fileInfo: { type: string; size: string; name: string } | null;
    zipInfo: { type: string; size: string; name: string } | null;
    handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleZipUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    clearFile: () => void;
    clearZip: () => void;
    fileUploaded: boolean;
    zipUploaded: boolean;
    hasMissingImages: boolean;
    csvData: BadgeDataRow[];
    imageTracking: ImageTrackingType;
    handlePreview: (csvRow: any) => void;
    handleDeleteRow: (rowIndex: number) => void;
    showLoader: boolean;
}> = ({
    fileInfo,
    zipInfo,
    handleUpload,
    handleZipUpload,
    clearFile,
    clearZip,
    fileUploaded,
    zipUploaded,
    hasMissingImages,
    csvData,
    imageTracking,
    handlePreview,
    handleDeleteRow,
    showLoader,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.FullScreen });

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const zipInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const triggerZipInput = () => zipInputRef.current?.click();
    const triggerFileInput = () => fileInputRef.current?.click();

    const handleClearFile = () => {
        if (fileInputRef?.current) {
            fileInputRef.current.value = '';
        }
        clearFile();
    };

    const handleClearZip = () => {
        if (zipInputRef?.current) {
            zipInputRef.current.value = '';
        }
        clearZip();
    };

    const handlePreviewAllCredentials = () => {
        newModal(
            <BulkBoostPreviewModal
                csvData={csvData}
                handlePreview={handlePreview}
                handleDeleteRow={handleDeleteRow}
                imageTracking={imageTracking}
            />,
            {
                sectionClassName: '!max-w-[500px] !bg-white',
                hideButton: true,
            }
        );
    };

    const showZipInput = fileUploaded && hasMissingImages;

    return (
        <section className="bg-white max-w-[800px] w-full rounded-[20px]">
            <div className="flex flex-col items-start justify-center w-full ion-padding">
                <h4
                    className={`text-${primaryColor} font-notoSans text-left mb-2 text-sm font-semibold`}
                >
                    Step 2
                </h4>
                <p className="text-xl text-grayscale-900 text-left mb-4">Upload Your .csv File</p>

                <p className="text-left text-grayscale-700 text-sm">
                    If you used filenames instead of URLs, upload a ZIP file containing those image
                    files.
                </p>

                <div
                    className={`w-full flex gap-[5px] rounded-[10px] bg-${primaryColor} bg-opacity-[10%] justify-center ion-padding mt-4`}
                >
                    <div className="flex flex-col">
                        <p
                            className={`flex items-center justify-start text-[18px] text-${primaryColor} font-poppins font-[600]`}
                        >
                            <CircleCheckOutlineIcon
                                className={`inline mr-2 text-${primaryColor}`}
                            />{' '}
                            Check Before Uploading
                        </p>
                        <p className={`text-xs text-${primaryColor} font-poppins mt-2`}>
                            Ensure all images are in place and any file errors are fixed before
                            continuing.
                        </p>
                    </div>
                </div>

                {!fileUploaded && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleUpload}
                            className="hidden"
                        />
                        <button
                            onClick={triggerFileInput}
                            className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] bg-${primaryColor} text-white mt-4`}
                        >
                            <UploadIcon className="inline mr-2" strokeWidth="2" /> Upload
                        </button>
                    </>
                )}

                {fileInfo && (
                    <div className="flex items-center justify-between w-full mt-4 relative pb-4">
                        <div className="flex flex-1 items-center justify-start">
                            <DocIcon className="text-[#FF3636] h-[55px] min-h-[55px] min-w-[55px] w-[55px] mr-2" />
                            <div className="flex items-start justify-center text-left flex-col pr-4">
                                <p className="text-grayscale-800 text-sm font-semibold text-left line-clamp-2">
                                    {fileInfo?.name}
                                </p>
                                <p className="w-full text-xs text-grayscale-600">
                                    {fileInfo?.type} • {fileInfo?.size}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleClearFile}
                            className="bg-white overflow-hidden rounded-full p-2 min-h-[35px] min-w-[35px]"
                        >
                            <TrashBin
                                version="thin"
                                className="text-grayscale-700 h-[25px] w-[25px]"
                            />
                        </button>
                    </div>
                )}

                {fileUploaded && hasMissingImages && (
                    <BulkImportMissingImagesError csvData={csvData} imageTracking={imageTracking} />
                )}

                {showZipInput && (
                    <>
                        <input
                            ref={zipInputRef}
                            type="file"
                            accept=".zip"
                            onChange={handleZipUpload}
                            className="hidden"
                        />
                        <button
                            onClick={triggerZipInput}
                            className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] bg-${primaryColor} text-white`}
                        >
                            {showLoader ? (
                                <IonSpinner name="crescent" className="inline mr-2" />
                            ) : (
                                <UploadIcon className="inline mr-2" strokeWidth="2" />
                            )}
                            {showLoader ? 'Uploading...' : 'Upload Images Zip'}
                        </button>
                    </>
                )}

                {zipInfo && (
                    <div className="flex items-center justify-between w-full pt-4 relative pb-4 border-t border-gray-200">
                        <div className="flex flex-1 items-center justify-start">
                            <CsvIcon className="h-[55px] min-h-[55px] min-w-[55px] w-[55px] mr-2" />
                            <div className="flex items-start justify-center text-left flex-col pr-4">
                                <p className="text-grayscale-800 text-sm font-semibold text-left line-clamp-2">
                                    {zipInfo?.name}
                                </p>
                                <p className="w-full text-xs text-grayscale-600">
                                    {zipInfo?.type} • {zipInfo?.size}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleClearZip}
                            className="bg-white overflow-hidden rounded-full p-2 min-h-[35px] min-w-[35px]"
                        >
                            <TrashBin
                                version="thin"
                                className="text-grayscale-700 h-[25px] w-[25px]"
                            />
                        </button>
                    </div>
                )}

                {csvData.length > 0 && (
                    <button
                        onClick={handlePreviewAllCredentials}
                        className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] bg-emerald-700 text-white mt-4`}
                    >
                        <EyeIcon className="inline mr-2" /> Preview {csvData.length} Credentials
                    </button>
                )}
            </div>
        </section>
    );
};

export default AdminToolsBulkBoostImportUploadStep;
