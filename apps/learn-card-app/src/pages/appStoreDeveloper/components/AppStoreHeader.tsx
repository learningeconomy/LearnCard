import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonHeader, IonToolbar } from '@ionic/react';
<<<<<<< HEAD
import { Shield, Code2, Hammer } from 'lucide-react';
=======
import { Shield, Code2 } from 'lucide-react';
>>>>>>> 279e0491c5f284f9343ef0c39f3c38cd76e608f9

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
    const isOnGuidesPage = location.pathname.includes('/app-store/developer/guides');
    const isOnDeveloperPage = location.pathname === '/app-store/developer' || 
        location.pathname.startsWith('/app-store/developer/new') ||
        location.pathname.startsWith('/app-store/developer/edit');

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
                <div className="flex items-center justify-between px-2 sm:px-4 py-2 overflow-visible">
                    <button
                        onClick={() => history.push('/launchpad')}
                        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb"
                            alt="LearnCard"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
                        />

                        <span className={`text-lg font-semibold text-gray-700 ${rightContent ? 'hidden sm:block' : ''}`}>{title}</span>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-3 overflow-visible">
                        {rightContent}

<<<<<<< HEAD
                        {/* Navigation tabs */}
                        <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
                            <button
                                onClick={() => history.push('/app-store/developer')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    isOnDeveloperPage
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Code2 className="w-4 h-4" />
                                Apps
                            </button>

                            <button
                                onClick={() => history.push('/app-store/developer/guides')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    isOnGuidesPage
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Hammer className="w-4 h-4" />
                                Build
                            </button>
                        </div>

                        {/* Mobile nav toggle for guides */}
                        <button
                            onClick={() => history.push(isOnGuidesPage ? '/app-store/developer' : '/app-store/developer/guides')}
                            className="sm:hidden flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isOnGuidesPage ? (
                                <Code2 className="w-4 h-4" />
                            ) : (
                                <Hammer className="w-4 h-4" />
                            )}
                        </button>

=======
>>>>>>> 279e0491c5f284f9343ef0c39f3c38cd76e608f9
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
