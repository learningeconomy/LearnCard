import React from 'react';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { IonPage, IonContent } from '@ionic/react';
import { AppCol, AppGrid, AppRow } from '../layout';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { AppHeader, AppToolbar } from '../chrome';

const MyDataAppsList: React.FC<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
    appsList: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
    setSelectedApp: React.Dispatch<any>;
    handleGoBack: () => void;
}> = ({ appsList = [], setSelectedApp, handleGoBack }) => {
    const brandingConfig = useBrandingConfig();

    return (
        <IonPage className="bg-grayscale-900">
            <AppHeader className="ion-no-border">
                <AppToolbar className="ion-no-border" color="grayscale-900">
                    <AppGrid className="bg-grayscale-900">
                        <AppRow className="w-full flex flex-col items-center justify-center">
                            <AppRow className="w-full max-w-[600px] flex items-center justify-between">
                                <AppCol className="flex flex-1 justify-start items-center">
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
                                </AppCol>
                            </AppRow>
                        </AppRow>
                    </AppGrid>
                </AppToolbar>
            </AppHeader>
            <IonContent fullscreen color="grayscale-900">
                <AppGrid className="flex items-center justify-center flex-col w-full px-4 pb-14">
                    <AppRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        {appsList.length > 0 ? (
                            appsList.map((appsListItem, index) => {
                                return (
                                    <AppCol
                                        size="12"
                                        className="w-full bg-white rounded-[20px]"
                                        key={index}
                                    >
                                        <button
                                            className="flex w-full items-center justify-between text-grayscale-900 ion-padding font-poppins text-xl border-b-2 border-solid border-grayscale-100"
                                            onClick={() => setSelectedApp(appsListItem)}
                                        >
                                            <div className="flex items-center justify-normal">
                                                <div className="w-[40px] h-[40px] flex items-center justify-center rounded-[10px] overflow-hidden shadow-xs">
                                                    <img
                                                        src={appsListItem?.image}
                                                        className="h-full w-full"
                                                    />
                                                </div>
                                                <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                                    {appsListItem?.name}
                                                </h3>
                                            </div>
                                            <CaretLeft className="rotate-180 text-grayscale-500" />
                                        </button>
                                    </AppCol>
                                );
                            })
                        ) : (
                            <>No Apps yet!</>
                        )}
                    </AppRow>
                    <AppRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <p className="w-full text-left text-grayscale-50 text-sm">
                            As apps request permission to update your {brandingConfig?.name} data,
                            they will be added to the list.
                        </p>
                    </AppRow>
                </AppGrid>
            </IonContent>
        </IonPage>
    );
};

export default MyDataAppsList;
