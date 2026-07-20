import React from 'react';
import { useGetBoostIssueHistory } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import { formatLocaleDate } from '../../../i18n/formatters';

type IssueHistoryBoxProps = {
    boostUri: string;
};

const IssueHistoryBox: React.FC<IssueHistoryBoxProps> = ({ boostUri }) => {
    const { issueHistory } = useGetBoostIssueHistory(boostUri);

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px] w-full relative">
            <h3 className="text-[17px] text-grayscale-900 font-notoSans">
                {m['troops.issueLog.title']()}
            </h3>
            {issueHistory?.map((historyItem, index) => {
                const { date, name, thumb } = historyItem;
                const hasBeenClaimed = !!date;
                return (
                    <div
                        key={index}
                        className="flex flex-col gap-[5px] py-[10px] border-b-[1px] border-grayscale-200 border-solid last:border-b-0 w-full"
                    >
                        <div className="flex gap-[6px]">
                            <div className="relative">
                                <img src={thumb} className="h-[25px] w-[25px] rounded-full" />
                                {hasBeenClaimed && (
                                    <CircleCheckmark
                                        className="absolute top-[-5px] left-[-5px] bg-white rounded-full"
                                        size="15"
                                    />
                                )}
                            </div>
                            <span className="text-grayscale-700 font-notoSans text-[14px] font-[500] leading-[140%]">
                                {m['troops.issueLog.issued']({ name })}
                            </span>
                        </div>
                        {date && (
                            <div className="font-notoSans text-[12px] font-[500] leading-[120%] text-emerald-700">
                                {m['troops.issueLog.claimed']({
                                    date: formatLocaleDate(date, {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    }),
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
            {issueHistory?.length === 0 && (
                <div className="flex flex-col py-[10px] items-start">
                    <span className="text-grayscale-700 font-notoSans text-[14px]">
                        {m['troops.issueLog.empty']()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default IssueHistoryBox;
