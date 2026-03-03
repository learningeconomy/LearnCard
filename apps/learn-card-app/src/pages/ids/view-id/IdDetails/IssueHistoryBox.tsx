import React from 'react';
import moment from 'moment';
import { useGetBoostIssueHistory } from 'learn-card-base';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';

type IssueHistoryBoxProps = {
    boostUri: string;
};

const IssueHistoryBox: React.FC<IssueHistoryBoxProps> = ({ boostUri }) => {
    const { issueHistory } = useGetBoostIssueHistory(boostUri);

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px] w-full relative">
            <h3 className="text-[17px] text-grayscale-900 font-notoSans">Issue Log</h3>
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
                                Issued to{' '}
                                <strong className="text-grayscale-900 font-[600]">{name}</strong>
                            </span>
                        </div>
                        {date && (
                            <div className="font-notoSans text-[12px] font-[500] leading-[120%] text-emerald-700">
                                Claimed {moment(date).format('MM/D/YY [at] hh:mm A z')}
                            </div>
                        )}
                    </div>
                );
            })}
            {issueHistory?.length === 0 && (
                <div className="flex flex-col py-[10px] items-start">
                    <span className="text-grayscale-700 font-notoSans text-[14px]">
                        No issue history
                    </span>
                </div>
            )}
        </div>
    );
};

export default IssueHistoryBox;
