import React from 'react';
import * as m from '../../paraglide/messages.js';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useNavigate } from 'react-router';

import MainHeader from '../../components/main-header/MainHeader';

import { BrandingEnum } from 'learn-card-base';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppCol } from 'learn-card-base/ui/layout';

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
    const navigate = useNavigate();

    const hasAdminAccess = flags.enableAdminTools;

    return (
        <AppPage className="bg-grayscale-100 h-full">
            <MainHeader customClassName="bg-white" branding={BrandingEnum.learncard} />

            <AppContent fullscreen className="bg-grayscale-100 h-full w-full">
                <AppCol className="flex flex-col gap-[40px] items-center mx-auto relative w-full h-auto min-h-full bg-grayscale-100 px-[20px] py-[30px]">
                    {hasAdminAccess && (
                        <>
                            <h1 className="text-grayscale-900 text-[28px] font-notoSans font-[600] flex gap-[20px] items-center">
                                {!hideBackButton && (
                                    <button onClick={() => navigate(-1)}>
                                        <CaretLeft className="rtl-mirror" />
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
                                {m['adminTools.noAccessTitle']()}
                            </h1>

                            <span className="text-grayscale-400">
                                {m['adminTools.noAccessSubtitle']()}
                            </span>
                        </>
                    )}
                </AppCol>
            </AppContent>
        </AppPage>
    );
};

export default AdminPageStructure;
