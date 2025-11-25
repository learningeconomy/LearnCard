import React from 'react';

import { IonItem, IonList, IonRow, IonCol } from '@ionic/react';

import RightArrow from 'learn-card-base/svgs/RightArrow';

import {
    MOCK_ACTIVITIES,
    ActivityTransactionStatusEnum,
    LearnCardActivityTransaction,
} from 'learn-card-base';

export const LearnCardActivityItem: React.FC<LearnCardActivityTransaction> = ({
    issuerName,
    issuerImage,
    issueDate,
    status,
    amount,
}) => {
    let statusStyles: string = '';
    let transactionAmount: React.ReactNode | null = null;
    if (status === ActivityTransactionStatusEnum.approved) {
        statusStyles = 'text-emerald-700';
        transactionAmount = (
            <p className="w-[70%] bg-emerald-100 text-emerald-700 font-bold rounded-[10px] p-1 text-center">
                +${(amount ?? 0).toFixed(2)}
            </p>
        );
    } else if (status === ActivityTransactionStatusEnum.pending) {
        statusStyles = 'text-[#F79E1B]';
        transactionAmount = (
            <p className="w-[70%] font-bold p-1 text-center">-{(amount ?? 0).toFixed(2)}</p>
        );
    } else if (status === ActivityTransactionStatusEnum.cancelled) {
        statusStyles = 'text-spice-700';
        transactionAmount = (
            <p className="w-[70%] font-bold p-1 text-center">-{(amount ?? 0).toFixed(2)}</p>
        );
    }

    return (
        <IonItem lines="none" className="w-full">
            <div className="w-full flex py-5 border-b-gray-100 border-b-2">
                <div className="flex items-center justify-start w-[60%]">
                    <div className="rounded-full bg-grayscale-900 mr-2 overflow-hidden h-[30px] w-[30px] flex items-center justify-center">
                        <img
                            src={issuerImage}
                            alt="logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <p className="text-grayscale-900 font-semibold text-xs line-clamp-1">
                            {issuerName}
                        </p>
                        <p className="font-semibold text-xs">
                            {issueDate} •{' '}
                            <span className={`capitalize ${statusStyles}`}>{status}</span>
                        </p>
                    </div>
                </div>
                <div className="w-[40%] flex items-center justify-end">
                    {transactionAmount} <RightArrow className="h-7 text-grayscale-600" />{' '}
                </div>
            </div>
        </IonItem>
    );
};

export const LearnCardActivityList = React.forwardRef<HTMLIonRowElement>((_props, ref) => (
    <IonRow className="flex items-center justify-center w-full" ref={ref}>
        <IonCol className="w-full flex items-center justify-center overflow-hidden max-w-[600px]">
            <IonList className="w-[90%] rounded-[20px] border-solid border-2 border-cyan-700 ">
                {MOCK_ACTIVITIES.map((activity, index) => (
                    <LearnCardActivityItem
                        key={index}
                        issuerName={activity?.issuerName}
                        issuerImage={activity?.issuerImage}
                        issueDate={activity?.issueDate}
                        status={activity?.status}
                        amount={activity?.amount}
                    />
                ))}
            </IonList>
        </IonCol>
    </IonRow>
));

export default LearnCardActivityList;
