import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useHistory } from 'react-router-dom';

import { IonContent, IonPage, IonCol } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import { BrandingEnum, currentUserStore } from 'learn-card-base';

type AdminPageStructureProps = {
    title: string;
    hideBackButton?: boolean;
    children: React.ReactNode;
};

const AdminPageStructure: React.FC<AdminPageStructureProps> = ({
    title,
    hideBackButton,
    children,
}) => {
    const history = useHistory();
    const flags = useFlags();
    const parentLDFlags = currentUserStore.use.parentLDFlags();

    const hasAdminAccess = flags.enableAdminTools || parentLDFlags?.enableAdminTools;

    return (
        <IonPage className="h-full">
            <MainHeader customClassName="bg-white" branding={BrandingEnum.learncard} />
            <GenericErrorBoundary>
                <IonContent fullscreen className="bg-grayscale-100 h-full w-full">
                    <IonCol className="flex flex-col gap-[40px] items-center mx-auto relative w-full h-auto min-h-full bg-grayscale-100 px-[20px] py-[30px]">
                        {hasAdminAccess && (
                            <>
                                <h1 className="text-grayscale-900 text-[28px] font-notoSans font-[600] flex gap-[20px] items-center">
                                    {!hideBackButton && (
                                        <button onClick={() => history.goBack()}>
                                            <CaretLeft />
                                        </button>
                                    )}
                                    {title}
                                </h1>

                                {children}
                            </>
                        )}
                        {!hasAdminAccess && (
                            <>
                                <h1 className="text-grayscale-900 text-[28px] font-notoSans font-[600]">
                                    Heyyyy, wait a minute. You shouldn't be here 🙅
                                </h1>

                                <span className="text-grayscale-400">sneaky sneaky...</span>

                                <div className="flex flex-col gap-[5px] items-center">
                                    <p className="text-grayscale-600 ">
                                        If you should have access, a refresh might fix this
                                    </p>
                                    <button
                                        className="border-[2px] border-grayscale-900 border-solid rounded-full py-[2px] px-[5px]"
                                        onClick={() => window.location.reload()}
                                    >
                                        Refresh
                                    </button>
                                </div>
                            </>
                        )}
                    </IonCol>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default AdminPageStructure;
