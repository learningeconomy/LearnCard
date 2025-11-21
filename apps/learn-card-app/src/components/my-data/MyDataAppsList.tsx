import React from 'react';

import { IonPage, IonGrid, IonCol, IonRow, IonToolbar, IonHeader, IonContent } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

const MyDataAppsList: React.FC<{
    appsList: any;
    setSelectedApp: React.Dispatch<any>;
    handleGoBack: () => void;
}> = ({ appsList = [], setSelectedApp, handleGoBack }) => {
    return (
        <IonPage className="bg-grayscale-900">
            <IonHeader className="ion-no-border">
                <IonToolbar className="ion-no-border" color="grayscale-900">
                    <IonGrid className="bg-grayscale-900">
                        <IonRow className="w-full flex flex-col items-center justify-center">
                            <IonRow className="w-full max-w-[600px] flex items-center justify-between">
                                <IonCol className="flex flex-1 justify-start items-center">
                                    <button
                                        className="text-white p-0 mr-[10px]"
                                        aria-label="Back button"
                                        onClick={handleGoBack}
                                    >
                                        <CaretLeft className="h-auto w-3 text-white" />
                                    </button>
                                    <h3 className="text-white flex items-center justify-start font-poppins text-xl font-medium">
                                        My Apps
                                    </h3>
                                </IonCol>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen color="grayscale-900">
                <IonGrid className="flex items-center justify-center flex-col w-full px-4 pb-14">
                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        {appsList.length > 0 ? (
                            appsList.map((appsListItem, index) => {
                                return (
                                    <IonCol
                                        size="12"
                                        className="w-full bg-white rounded-[20px]"
                                        key={index}
                                    >
                                        <button
                                            className="flex w-full items-center justify-between text-grayscale-900 ion-padding font-poppins text-xl border-b-2 border-solid border-grayscale-100"
                                            onClick={() => setSelectedApp(appsListItem)}
                                        >
                                            <div className="flex items-center justify-normal">
                                                <div className="w-[40px] h-[40px] flex items-center justify-center rounded-[10px] overflow-hidden shadow-sm">
                                                    <img
                                                        src={appsListItem?.image}
                                                        className="h-full w-full"
                                                    />
                                                </div>
                                                <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                                    {appsListItem?.name}
                                                </h3>
                                            </div>
                                            <CaretLeft className="rotate-[180deg] text-grayscale-500" />
                                        </button>
                                    </IonCol>
                                );
                            })
                        ) : (
                            <>No Apps yet!</>
                        )}
                    </IonRow>
                    <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <p className="w-full text-left text-grayscale-50 text-sm">
                            As apps request permission to update your LearnCard data, they will be
                            added to the list.
                        </p>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default MyDataAppsList;
