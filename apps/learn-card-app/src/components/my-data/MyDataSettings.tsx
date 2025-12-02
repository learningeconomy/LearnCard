import React from 'react';

import {
    IonPage,
    IonGrid,
    IonCol,
    IonRow,
    IonToolbar,
    IonHeader,
    IonContent,
    IonToggle,
} from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { boostVCTypeOptions } from '../boost/boost-options/boostOptions';
import { ProfilePicture } from 'learn-card-base';

const MyDataSettings: React.FC<{
    selectedItem: any;
    handleGoBack: () => void;
}> = ({ selectedItem, handleGoBack }) => {
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
                                        onClick={handleGoBack}
                                    >
                                        <CaretLeft className="h-auto w-3 text-white" />
                                    </button>

                                    <div className="flex items-center justify-normal">
                                        <div className="w-[40px] h-[40px] flex items-center justify-center rounded-[10px] overflow-hidden shadow-sm">
                                            <img
                                                src={selectedItem?.image}
                                                className="h-full w-full"
                                            />
                                        </div>
                                        <h3 className="text-white flex items-center justify-start font-poppins text-2xl ml-2">
                                            {selectedItem?.name}
                                        </h3>
                                    </div>
                                </IonCol>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen color="grayscale-900">
                <IonGrid className="flex items-center justify-center flex-col w-full px-4 pb-14">
                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <IonCol
                            size="12"
                            className="flex flex-col items-center justify-between w-full bg-white rounded-[20px] ion-padding"
                        >
                            <p className="text-grayscale-900 text-base w-full text-left mb-4 font-medium">
                                {selectedItem?.name} will use data to:
                            </p>
                            <p className="text-grayscale-600 text-sm w-full text-left">
                                We will use your data to train a personalized tutor for you based on
                                your skills, goals, and experiences.
                            </p>
                        </IonCol>
                    </IonRow>

                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <IonCol
                            size="12"
                            className="flex items-center justify-between w-full bg-white rounded-[20px] ion-padding"
                        >
                            <div className="flex items-center justify-between w-full">
                                <h1 className="font-poppins text-black text-lg p-0 m-0 normal">
                                    Turn All On
                                </h1>
                            </div>

                            <IonToggle
                                mode="ios"
                                color="emerald-700"
                                // onIonInput={() => {
                                //     setToggle(!toggle);
                                // }}
                                // checked={toggle}
                            />
                        </IonCol>
                    </IonRow>

                    <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <p className="w-full text-left text-white text-base normal">
                            Allow "{selectedItem?.name}" to write
                        </p>
                    </IonRow>

                    <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <IonCol
                            size="12"
                            className="flex flex-col w-full bg-white rounded-[20px] ion-padding"
                        >
                            {boostVCTypeOptions?.someone?.map(option => {
                                const {
                                    IconComponent,
                                    title,
                                    type,
                                    iconClassName,
                                    iconCircleClass,
                                } = option;

                                return (
                                    <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                        <div className="flex">
                                            <div
                                                className={`flex items-center justify-center h-[40px] w-[40px] left-1 rounded-full ${iconCircleClass}`}
                                            >
                                                <IconComponent
                                                    className={`h-[30px] ${iconClassName}`}
                                                />
                                            </div>
                                            <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                                {title}
                                            </h3>
                                        </div>

                                        <IonToggle
                                            mode="ios"
                                            color="emerald-700"
                                            // onIonInput={() => {
                                            //     setToggle(!toggle);
                                            // }}
                                            // checked={toggle}
                                        />
                                    </div>
                                );
                            })}
                        </IonCol>
                    </IonRow>

                    <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <p className="w-full text-left text-white text-base normal">
                            Allow "{selectedItem?.name}" to read
                        </p>
                    </IonRow>

                    <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <IonCol
                            size="12"
                            className="flex flex-col w-full bg-white rounded-[20px] ion-padding"
                        >
                            {boostVCTypeOptions?.someone?.map(option => {
                                const {
                                    IconComponent,
                                    title,
                                    type,
                                    iconClassName,
                                    iconCircleClass,
                                } = option;

                                return (
                                    <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                        <div className="flex">
                                            <div
                                                className={`flex items-center justify-center h-[40px] w-[40px] left-1 rounded-full ${iconCircleClass}`}
                                            >
                                                <IconComponent
                                                    className={`h-[30px] ${iconClassName}`}
                                                />
                                            </div>
                                            <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                                {title}
                                            </h3>
                                        </div>

                                        <IonToggle
                                            mode="ios"
                                            color="emerald-700"
                                            // onIonInput={() => {
                                            //     setToggle(!toggle);
                                            // }}
                                            // checked={toggle}
                                        />
                                    </div>
                                );
                            })}
                            <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                <div className="flex">
                                    <ProfilePicture
                                        customImageClass="w-full h-full"
                                        customContainerClass="h-[40px] w-[40px] flex items-center justify-center rounded-full overflow-hidden text-white font-bold text-xl"
                                    />

                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                        Name
                                    </h3>
                                </div>

                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    // onIonInput={() => {
                                    //     setToggle(!toggle);
                                    // }}
                                    // checked={toggle}
                                />
                            </div>
                            <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                <div className="flex">
                                    <ProfilePicture
                                        customImageClass="w-full h-full"
                                        customContainerClass="h-[40px] w-[40px] flex items-center justify-center rounded-full overflow-hidden text-white font-bold text-xl"
                                    />

                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                        Age
                                    </h3>
                                </div>

                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    // onIonInput={() => {
                                    //     setToggle(!toggle);
                                    // }}
                                    // checked={toggle}
                                />
                            </div>
                            <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                <div className="flex">
                                    <ProfilePicture
                                        customImageClass="w-full h-full"
                                        customContainerClass="h-[40px] w-[40px] flex items-center justify-center rounded-full overflow-hidden text-white font-bold text-xl"
                                    />

                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                        Race
                                    </h3>
                                </div>

                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    // onIonInput={() => {
                                    //     setToggle(!toggle);
                                    // }}
                                    // checked={toggle}
                                />
                            </div>
                            <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                <div className="flex">
                                    <ProfilePicture
                                        customImageClass="w-full h-full"
                                        customContainerClass="h-[40px] w-[40px] flex items-center justify-center rounded-full overflow-hidden text-white font-bold text-xl"
                                    />

                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                        Gender
                                    </h3>
                                </div>

                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    // onIonInput={() => {
                                    //     setToggle(!toggle);
                                    // }}
                                    // checked={toggle}
                                />
                            </div>
                            <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                <div className="flex">
                                    <ProfilePicture
                                        customImageClass="w-full h-full"
                                        customContainerClass="h-[40px] w-[40px] flex items-center justify-center rounded-full overflow-hidden text-white font-bold text-xl"
                                    />

                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                        Postal Code
                                    </h3>
                                </div>

                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    // onIonInput={() => {
                                    //     setToggle(!toggle);
                                    // }}
                                    // checked={toggle}
                                />
                            </div>
                            <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100">
                                <div className="flex">
                                    <ProfilePicture
                                        customImageClass="w-full h-full"
                                        customContainerClass="h-[40px] w-[40px] flex items-center justify-center rounded-full overflow-hidden text-white font-bold text-xl"
                                    />

                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                        Language
                                    </h3>
                                </div>

                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    // onIonInput={() => {
                                    //     setToggle(!toggle);
                                    // }}
                                    // checked={toggle}
                                />
                            </div>
                        </IonCol>

                        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                            <IonCol
                                size="12"
                                className="flex flex-col items-center justify-between w-full bg-white rounded-[20px]"
                            >
                                <button className="flex w-full items-center justify-between text-grayscale-900 ion-padding font-poppins text-xl border-b-2 border-solid border-grayscale-100">
                                    <div className="flex items-center justify-normal">
                                        <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl">
                                            Data shared with {selectedItem?.name}
                                        </h3>
                                    </div>
                                    <CaretLeft className="rotate-[180deg] text-grayscale-500" />
                                </button>
                            </IonCol>
                        </IonRow>

                        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                            <IonCol
                                size="12"
                                className="flex flex-col items-center justify-between w-full bg-white rounded-[20px]"
                            >
                                <button className="flex w-full items-center justify-between text-grayscale-900 ion-padding font-poppins text-xl border-b-2 border-solid border-grayscale-100">
                                    <div className="flex items-center justify-normal">
                                        <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl">
                                            Data usage by {selectedItem?.name}
                                        </h3>
                                    </div>
                                    <CaretLeft className="rotate-[180deg] text-grayscale-500" />
                                </button>
                            </IonCol>
                        </IonRow>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default MyDataSettings;
