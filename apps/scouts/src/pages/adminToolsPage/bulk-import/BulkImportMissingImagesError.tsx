import React from 'react';
import { BadgeDataRow, DataKeys, ImageStatus, ImageTrackingType } from './BulkBoostImportPage';
import X from 'learn-card-base/svgs/X';

type BulkImportMissingImagesErrorProps = {
    csvData: BadgeDataRow[];
    imageTracking: ImageTrackingType;
};

const BulkImportMissingImagesError: React.FC<BulkImportMissingImagesErrorProps> = ({
    csvData,
    imageTracking,
}) => {
    // Get missing images summary
    const getMissingImagesSummary = () => {
        const missingImages: Array<{ rowIndex: number; title: string; imageKeys: string[] }> = [];

        for (const [rowIndex, rowMap] of imageTracking.entries()) {
            const missingKeys: string[] = [];

            for (const [key, info] of rowMap.entries()) {
                if (
                    info.status === ImageStatus.needsUpload ||
                    info.status === ImageStatus.missing
                ) {
                    missingKeys.push(key);
                }
            }

            if (missingKeys.length > 0) {
                missingImages.push({
                    rowIndex,
                    title: csvData[rowIndex][DataKeys.title],
                    imageKeys: missingKeys,
                });
            }
        }

        return missingImages;
    };

    const missingImages = getMissingImagesSummary();
    if (missingImages.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 max-w-[800px] mx-auto">
            <h3 className="text-red-700 font-medium flex items-center">
                <X className="h-5 w-5 mr-2" /> Missing Images
            </h3>
            <p className="text-red-600 mb-2">The following records are missing image URLs:</p>
            <ul className="text-red-600 list-disc pl-6 mb-4">
                {missingImages.slice(0, 5).map((item, index) => (
                    <li key={index}>
                        <strong>{item.title}</strong>: {item.imageKeys.join(', ')}
                    </li>
                ))}
                {missingImages.length > 5 && (
                    <li>...and {missingImages.length - 5} more records</li>
                )}
            </ul>
            <p className="text-red-700">
                Please upload a ZIP file containing these images or provide direct URLs in the
                spreadsheet.
            </p>
        </div>
    );
};

export default BulkImportMissingImagesError;
