import React, { useState } from 'react';

import BulkBoostPreviewItem from './BulkBoostPreviewItem';

import { useModal } from 'learn-card-base';
import {
    BadgeDataRow,
    deleteIndexAndReindex,
    ImageTrackingType,
} from '../AdminToolsBulkBoostImportOption';

const BulkBoostPreviewModal: React.FC<{
    csvData: BadgeDataRow[];
    imageTracking: ImageTrackingType;
    handlePreview: (csvRow: any) => void;
    handleDeleteRow: (rowIndex: number) => void;
}> = ({ csvData, imageTracking, handlePreview, handleDeleteRow }) => {
    const { closeModal } = useModal();

    const [_csvData, _setCsvData] = useState(csvData);
    const [_imageTracking, _setImageTracking] = useState(imageTracking);

    const onDeleteRow = (rowIndex: number) => {
        handleDeleteRow(rowIndex);
        _setCsvData(prev => prev.filter((_, i) => i !== rowIndex));
        _setImageTracking(prev => deleteIndexAndReindex(prev, rowIndex));
    };

    return (
        <div className="flex flex-col bg-grayscale-100 h-full relative">
            <div className="absolute top-0 left-0 bg-white px-4 py-[24px] shadow-header w-full z-10">
                <div className="max-w-[600px] flex items-center justify-between mx-auto">
                    <h2 className="text-grayscale-800 text-xl">
                        Preview {_csvData?.length ?? 0} Credentials
                    </h2>
                </div>
            </div>

            <section className="flex-1 p-[20px] w-full mx-auto overflow-y-scroll pt-[100px] pb-[120px]">
                <div className="flex flex-col gap-[20px]">
                    {_csvData.map((row, index) => {
                        return (
                            <BulkBoostPreviewItem
                                index={index}
                                key={index}
                                row={row}
                                imageTracking={_imageTracking}
                                handleDeleteRow={onDeleteRow}
                                handlePreview={handlePreview}
                            />
                        );
                    })}
                </div>
            </section>

            <footer className="absolute bottom-0 p-[20px] bg-white bg-opacity-70 backdrop-blur-[5px] border-t-[1px] border-solid border-white w-full z-20">
                <div className="max-w-[600px] flex items-center justify-between mx-auto w-full gap-[10px]">
                    <button
                        onClick={closeModal}
                        className="bg-white flex-1 p-[7px] text-grayscale-900 font-poppins text-[17px] rounded-[30px] border-[1px] border-solid border-grayscale-200 shadow-button-bottom h-[44px]"
                    >
                        Close
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default BulkBoostPreviewModal;
