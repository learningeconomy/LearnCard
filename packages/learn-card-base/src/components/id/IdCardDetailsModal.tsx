import React from 'react';

import {
    IonContent,
    IonPage,
    IonToolbar,
    IonButtons,
    IonRow,
    IonCol,
    IonTitle,
    IonHeader,
} from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import defaultLC_id_bg from 'learn-card-base/assets/images/default-lc-id-bg.png';
import { SchoolIDCard } from '@learncard/react';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { getUrlFromImage } from 'learn-card-base/helpers/credentialHelpers';
import { resizeAndChangeQuality } from '@learncard/helpers';
import { LCR } from 'learn-card-base/types/credential-records';
import { useGetResolvedCredential } from 'learn-card-base/react-query/queries/vcQueries';

const IdCardDetailsModal: React.FC<{ handleModal: () => void; data: LCR }> = ({
    data,
    handleModal,
}) => {
    const { data: credential } = useGetResolvedCredential(data?.uri);

    const currentUser = useCurrentUser();
    const idName = credential?.credentialSubject?.achievement?.name ?? 'ID Card';
    const idType = credential?.credentialSubject?.achievement?.achievementType;
    const issuer = credential?.issuer;
    const userName = currentUser?.name;
    const userImgUrl = currentUser?.profileImage;
    // todo install date library (probably not moment)
    const issuanceDate = new Date(credential?.issuanceDate)?.toDateString();

    const issuerDisplay = typeof issuer === 'string' ? issuer : issuer?.name || issuer?.id;

    const text = (
        <h3 className="text-xs font-bold uppercase text-[#006937]">
            <span className="text-black">{idName}</span>
        </h3>
    );

    //split name and get first letters (assumes name is 'aaaa bbbb')
    const nameAbbr =
        userName &&
        userName?.split(/\s/).reduce((response, word) => (response += word.slice(0, 1)), '');

    return (
        <IonPage className="modal-wrapper">
            <IonHeader className="ion-no-border ion-fixed">
                <IonToolbar className=" ion-no-border ">
                    <IonButtons slot="start">
                        <button className="text-grayscale-600 bg-transparent" onClick={handleModal}>
                            <LeftArrow className="w-10 h-auto text-grayscale-600" />
                        </button>
                    </IonButtons>
                    <IonTitle className="flex items-center justify-center w-full overflow-visible z-20">
                        <IonCol
                            size="12"
                            className="flex items-center justify-center flex-col text-center"
                        >
                            <h2 className="text-black font-bold text-sm uppercase">{idName}</h2>
                            {/* <p className="text-sm font-medium text-grayscale-600 mb-1">
                                Motlow State Community College
                            </p>
                            <h4 className="text-emerald-700 font-bold text-xs uppercase">
                                Active ID
                            </h4> */}
                        </IonCol>
                    </IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="bg-white h-full relative" fullscreen>
                <div className="absolute bottom-0 left-0 w-full h-[80%] bg-yellow-100 z-10 rounded-tr-[75px] rounded-tl-[75px]" />
                <IonRow className="w-full flex items-center justify-center mt-7">
                    <IonCol className="w-full flex items-center justify-center z-50 max-w-[400px]">
                        <SchoolIDCard
                            backgroundImage={resizeAndChangeQuality(
                                getUrlFromImage(credential?.image || defaultLC_id_bg),
                                304,
                                80
                            )}
                            subjectInitials={nameAbbr}
                            subjectInitialsClass={
                                'w-[70px] h-[70px] bg-yellow-500 uppercase flex-shrink-0'
                            }
                            userName={userName}
                            userImage={userImgUrl}
                            text={text}
                            extraText=""
                            className="text-black lc-id-card border-8 border-yellow-500 full-id-card-view w-full bg-center bg-cover max-w-[320px]"
                        />
                    </IonCol>
                </IonRow>

                <IonRow className="w-full flex items-center justify-center">
                    <IonCol className="flex items-start justify-center flex-col max-w-[335px] z-50">
                        <h3 className="text-black font-semibold">Issued To</h3>
                        <p className="text-grayscale-600 font-medium text-sm">{userName}</p>
                    </IonCol>
                </IonRow>
                <IonRow className="w-full flex items-center justify-center">
                    <IonCol className="flex items-start justify-center flex-col max-w-[335px] z-50">
                        <h3 className="text-black font-semibold">Card Type</h3>
                        <p className="text-grayscale-600 font-medium text-sm">{idType}</p>
                    </IonCol>
                </IonRow>

                <IonRow className="w-full flex items-center justify-center">
                    <IonCol className="flex items-start justify-center flex-col max-w-[335px] z-50">
                        <h3 className="text-black font-semibold">Issued On</h3>
                        <p className="text-grayscale-600 font-medium text-sm">{issuanceDate}</p>
                    </IonCol>
                </IonRow>
                <IonRow className="w-full flex items-center justify-center">
                    <IonCol className="flex items-start justify-center flex-col max-w-[335px] z-50">
                        <h3 className="text-black font-semibold">Issued By</h3>
                        <p className="text-grayscale-600 font-medium text-sm line-clamp-1 max-w-[300px]">
                            {issuerDisplay}
                        </p>
                    </IonCol>
                </IonRow>
                {/* <IonRow className="w-full flex items-center justify-center">
                    <IonCol className="flex items-start justify-center flex-col max-w-[335px] z-50">
                        <div className="bg-yellow-300 w-full max-w-[335px] h-[2px] mt-6" />
                        <button className="w-full text-black font-bold bg-white border-yellow-400 border-solid border-2 rounded-full ion-padding mt-7">
                            Delete
                        </button>
                    </IonCol>
                </IonRow> */}
            </IonContent>
        </IonPage>
    );
};

export default IdCardDetailsModal;
