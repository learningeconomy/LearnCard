import React from 'react';
import moment from 'moment';
import * as m from '../../../paraglide/messages.js';
import { getLogger } from 'learn-card-base';
const log = getLogger('history-box');

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

const getLocalizedHistoryType = (type: HistoryTypeEnum): string => {
    const map: Record<HistoryTypeEnum, string> = {
        [HistoryTypeEnum.issued]: m['troops.history.typeIssued'](),
        [HistoryTypeEnum.updated]: m['troops.history.typeUpdate'](),
        [HistoryTypeEnum.revoked]: m['troops.history.typeRevoke'](),
        [HistoryTypeEnum.expired]: m['troops.history.typeExpire'](),
    };
    return map[type];
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
            <h3 className="text-[17px] text-grayscale-900 font-notoSans">{m['troops.history.title']()}</h3>
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
                                    {m['troops.history.entry']({ type: getLocalizedHistoryType(type), date: formatDate(dateIsoString) })}
                                </span>
                                {idUri && (
                                    <button
                                        onClick={() => log.debug('TODO View ID')}
                                        className="text-sp-blue-ocean font-notoSans text-[14px] font-[600]"
                                    >
                                        {m['troops.history.viewId']()}
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
                        {m['troops.history.empty']()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default HistoryBox;
