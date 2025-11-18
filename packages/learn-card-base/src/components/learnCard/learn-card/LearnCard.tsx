import React from 'react';

import { IonCol, IonRow } from '@ionic/react';
import { LearnCardCreditCardFrontFace } from '@learncard/react';

import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';

import { transformWeb3AuthProfileImage } from 'learn-card-base/helpers/web3AuthHelpers';

export const LearnCard = () => {
    const currentUser = useCurrentUser();

    const userImageEl = (
        <ProfilePicture customContainerClass="inline-block flex items-center justify-center relative overflow-hidden rounded-full shadow-3xl mt-2 ml-4 w-[90px] h-[90px] text-white font-medium text-5xl" />
    );

    return (
        <IonRow className="flex items-center justify-center z-10 w-full bg-white">
            <IonCol className="flex items-center justify-center flex-col max-w-[600px]">
                <IonCol size="12" className="flex items-center justify-start z-10 pl-[24px]">
                    <div>
                        <h1 className="font-black text-grayscale-900 learn-card-balance-big">1,2345</h1>
                    </div>
                    <div className="flex items-start justify-start h-full ml-1">
                        <span className="font-black text-grayscale-900 learn-card-balance-small">
                            56<span className="text-emerald-700">$</span>
                        </span>
                    </div>
                </IonCol>
                <IonCol size="12" className="flex items-center justify-center w-full mt-3 z-10">
                    <LearnCardCreditCardFrontFace
                        className="w-full learn-card-front-face"
                        qrCodeValue="https://www.npmjs.com/package/@learncard/react"
                        userImage={transformWeb3AuthProfileImage(
                            currentUser?.profileImage,
                            currentUser?.typeOfLogin
                        )}
                        showActionButton
                        userImageComponent={userImageEl}
                    />
                </IonCol>
                <IonCol size="11" className="flex items-center justify-center w-[90%] mt-3 z-10">
                    <button className="w-[40%] flex items-center justify-center bg-white text-grayscale-900  py-3 font-bold text-lg rounded-[40px] border-2 border-solid border-cyan-700">
                        <QRCodeScanner className="h-[25px] mr-2" /> Scan
                    </button>
                    <button className="w-[60%] flex items-center justify-center bg-cyan-700 text-white  py-3 ml-4 font-bold text-lg rounded-[40px]">
                        Send or Receive
                    </button>
                </IonCol>
            </IonCol>
            <div className="bg-cyan-100 absolute left-0 bottom-0 w-full h-1/2 learn-card-bubble-underlay" />
        </IonRow>
    );
};

export default LearnCard;
