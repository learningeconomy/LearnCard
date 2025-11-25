import React from 'react';

import { IonPage, IonGrid, IonCol, IonRow, IonToolbar, IonHeader, IonContent } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import ShieldCheck from 'learn-card-base/svgs/ShieldCheck';
import BellSimple from 'learn-card-base/svgs/BellSimple';
import LockSimple from 'learn-card-base/svgs/LockSimple';

import useTheme from '../../theme/hooks/useTheme';

import { MyDataStepsEnum } from './MyData';

const MyDataOverview: React.FC<{
    handleCloseModal: () => void;
    activeStep: MyDataStepsEnum;
    setActiveStep: React.Dispatch<React.SetStateAction<MyDataStepsEnum>>;
}> = ({ handleCloseModal, activeStep, setActiveStep }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <IonPage className="bg-grayscale-900">
            <IonHeader className="ion-no-border mt-[25px]">
                <IonToolbar className="ion-no-border" color="grayscale-900">
                    <IonGrid className="bg-grayscale-900">
                        <IonRow className="w-full flex flex-col items-center justify-center">
                            <IonRow className="w-full max-w-[600px] flex items-center justify-between">
                                <IonCol className="flex flex-1 justify-start items-center">
                                    <button
                                        className="text-white p-0 mr-[10px]"
                                        aria-label="Back button"
                                        onClick={handleCloseModal}
                                    >
                                        <CaretLeft className="h-auto w-3 text-white" />
                                    </button>
                                    <h3 className="text-white flex items-center justify-start font-poppins text-4xl">
                                        My Data
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
                        <IonCol size="12" className="w-full bg-white rounded-[20px]">
                            <div className="flex items-center justify-between w-full pl-4 pr-4 pt-4">
                                <h1 className="font-poppins text-black text-xl p-0 m-0">My Data</h1>
                            </div>

                            <div className="flex items-start justify-start w-full ion-padding">
                                <ShieldCheck
                                    className={`text-${primaryColor} w-[40px] min-w-[40px]`}
                                />
                                <div className="ml-2">
                                    <h4 className="text-grayscale-900 text-xl font-medium font-poppins tracking-wide">
                                        You’re in Control!
                                    </h4>
                                    <p className="text-left text-grayscale-600 text-sm">
                                        You are the sovereign owner and controller of your data. You
                                        decide how to use it and have a transparent list of how it
                                        is being used.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start justify-start w-full ion-padding">
                                <BellSimple
                                    className={`text-${primaryColor} w-[30px] min-w-[30px]`}
                                />
                                <div className="ml-4">
                                    <h4 className="text-grayscale-900 text-xl font-medium font-poppins tracking-wide">
                                        Dashboard & Notifications
                                    </h4>
                                    <p className="text-left text-grayscale-600 text-sm">
                                        Personal and anonymous data you share will appear in their
                                        dashboard. They can also get notifications if there's an
                                        update.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start justify-start w-full ion-padding">
                                <LockSimple
                                    className={`text-${primaryColor} w-[40px] min-w-[40px]`}
                                />
                                <div className="ml-2">
                                    <h4 className="text-grayscale-900 text-xl font-medium font-poppins tracking-wide">
                                        Private & Secure
                                    </h4>
                                    <p className="text-left text-grayscale-600 text-sm">
                                        Anonymous data you share contains no personal data about who
                                        you are, and all data shared is encrypted and you can stop
                                        sharing at any time.
                                    </p>
                                </div>
                            </div>

                            <div className="w-full flex flex-col items-center justify-center mt-4">
                                <button
                                    className={`flex items-center justify-center text-white rounded-full px-[64px] py-[12px] bg-${primaryColor} font-poppins text-xl w-full shadow-3xl normal max-w-[325px] mb-4`}
                                >
                                    Share With Someone
                                </button>
                            </div>

                            <div className="w-full flex flex-col items-center justify-center">
                                <button
                                    className={`flex items-center justify-center text-${primaryColor} rounded-full bg-transparent text-base w-full max-w-[325px] mb-4 font-medium`}
                                >
                                    Ask Someone to Share
                                </button>
                            </div>
                        </IonCol>
                    </IonRow>

                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <IonCol size="12" className="w-full bg-white rounded-[20px]">
                            <button
                                onClick={() => setActiveStep(MyDataStepsEnum.apps)}
                                className="flex w-full items-center justify-between text-grayscale-900 ion-padding font-poppins text-xl border-b-2 border-solid border-grayscale-100"
                            >
                                Apps
                                <CaretLeft className="rotate-[180deg] text-grayscale-500" />
                            </button>
                        </IonCol>
                        <IonCol size="12" className="w-full bg-white rounded-[20px]">
                            <button
                                onClick={() => setActiveStep(MyDataStepsEnum.schools)}
                                className="flex w-full items-center justify-between text-grayscale-900 ion-padding font-poppins text-xl border-b-2 border-solid border-grayscale-100"
                            >
                                Schools
                                <CaretLeft className="rotate-[180deg] text-grayscale-500" />
                            </button>
                        </IonCol>
                        <IonCol size="12" className="w-full bg-white rounded-[20px]">
                            <button
                                onClick={() => setActiveStep(MyDataStepsEnum.jobs)}
                                className="flex w-full items-center justify-between text-grayscale-900 ion-padding font-poppins text-xl"
                            >
                                Jobs
                                <CaretLeft className="rotate-[180deg] text-grayscale-500" />
                            </button>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default MyDataOverview;
