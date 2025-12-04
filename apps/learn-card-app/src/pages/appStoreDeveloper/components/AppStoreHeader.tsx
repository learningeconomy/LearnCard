import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonHeader, IonToolbar } from '@ionic/react';
import { Shield, Code2 } from 'lucide-react';

import QRCodeScannerButton from '../../../components/qrcode-scanner-button/QRCodeScannerButton';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { useDeveloperPortal } from '../useDeveloperPortal';

interface AppStoreHeaderProps {
    title?: string;
    rightContent?: React.ReactNode;
}

export const AppStoreHeader: React.FC<AppStoreHeaderProps> = ({ title = 'App Store Portal', rightContent }) => {
    const history = useHistory();
    const location = useLocation();
    const { useIsAdmin } = useDeveloperPortal();
    const { data: isAdmin } = useIsAdmin();

    const isOnAdminPage = location.pathname.includes('/app-store/admin');

    const handlePortalToggle = () => {
        if (isOnAdminPage) {
            history.push('/app-store/developer');
        } else {
            history.push('/app-store/admin');
        }
    };

    return (
        <IonHeader className="ion-no-border !overflow-visible">
            <IonToolbar className="!shadow-none border-b border-gray-200 !overflow-visible [&>.toolbar-container]:!overflow-visible">
                <div className="flex items-center justify-between px-4 py-2 overflow-visible">
                    <button
                        onClick={() => history.push('/launchpad')}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb"
                            alt="LearnCard"
                            className="w-10 h-10 rounded-lg"
                        />

                        <span className="text-lg font-semibold text-gray-700">{title}</span>
                    </button>

                    <div className="flex items-center gap-3 overflow-visible">
                        {rightContent}

                        {isAdmin && (
                            <button
                                onClick={handlePortalToggle}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {isOnAdminPage ? (
                                    <>
                                        <Code2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Developer</span>
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        <span className="hidden sm:inline">Admin</span>
                                    </>
                                )}
                            </button>
                        )}

                        <QRCodeScannerButton branding={BrandingEnum.learncard} />
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default AppStoreHeader;
