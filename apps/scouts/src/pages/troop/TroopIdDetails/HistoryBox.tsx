import React from 'react';
import moment from 'moment';

export enum HistoryTypeEnum {
    issued = 'Issued',
    updated = 'Updated',
    revoked = 'Revoked',
    expired = 'Expired',
}

export type HistoryItem = {
    type: HistoryTypeEnum;
    dateIsoString: string;
    idUri: string;
};

type HistoryBoxProps = {
    history: HistoryItem[];
};

const HistoryBox: React.FC<HistoryBoxProps> = ({ history }) => {
    const formatDate = (dateIso: string) => {
        // might need something like this to properly recognize timezone
        //   moment(dateIso).tz('America/Los_Angeles').format('MM/DD/YY [at] hh:mm A z')
        return moment(dateIso).format('MM/D/YY [at] hh:mm A z');
    };

    const historyExists = history.length > 0;

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px] w-full relative">
            <h3 className="text-[17px] text-grayscale-900 font-notoSans">History</h3>
            {historyExists && (
                <div className="flex flex-col w-full">
                    {history?.map((historyItem, index) => {
                        const { type, dateIsoString, idUri } = historyItem;
                        return (
                            <div
                                className="flex flex-col py-[10px] border-b-[1px] border-grayscale-200 border-solid last:border-b-0 w-full items-start"
                                key={index}
                            >
                                <span className="text-grayscale-700 font-notoSans text-[14px]">
                                    <strong className="font-notoSans font-[600]">{type}</strong> on{' '}
                                    {formatDate(dateIsoString)}
                                </span>
                                {idUri && (
                                    <button
                                        onClick={() => console.log('TODO View ID')}
                                        className="text-sp-blue-ocean font-notoSans text-[14px] font-[600]"
                                    >
                                        View ID
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {!historyExists && (
                <div className="flex flex-col py-[10px] items-start">
                    <span className="text-grayscale-700 font-notoSans text-[14px]">
                        No history available
                    </span>
                </div>
            )}
        </div>
    );
};

export default HistoryBox;
