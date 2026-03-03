import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useHistory } from 'react-router';

import { IonContent, IonPage, IonCol } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';

import { BrandingEnum } from 'learn-card-base';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

type AdminPageStructureProps = {
    title: string;
    hideBackButton?: boolean;
    children: React.ReactNode;
};

const AdminPageStructure: React.FC<AdminPageStructureProps> = ({
    title,
    hideBackButton = false,
    children,
}) => {
    const flags = useFlags();
    const history = useHistory();

    const hasAdminAccess = flags.enableAdminTools;

    return (
        <IonPage className="bg-grayscale-100 h-full">
            <MainHeader customClassName="bg-white" branding={BrandingEnum.learncard} />

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
                        </>
                    )}
                </IonCol>
            </IonContent>
        </IonPage>
    );
};

export default AdminPageStructure;
