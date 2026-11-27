import React from 'react';
import * as m from '../../../paraglide/messages.js';
import { useLocation, useNavigate } from 'react-router';
import { Shield, Code2, Hammer } from 'lucide-react';

import { AccountSwitcher } from './AccountSwitcher';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { AppHeader, AppToolbar } from 'learn-card-base/ui/chrome';

interface AppStoreHeaderProps {
    title?: string;
    rightContent?: React.ReactNode;
}

export const AppStoreHeader: React.FC<AppStoreHeaderProps> = ({ title, rightContent }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { useIsAdmin } = useDeveloperPortal();
    const { data: isAdmin } = useIsAdmin();

    // Get current integration from context (derived from URL)
    const { currentIntegrationId, goToIntegrationHub } = useDeveloperPortalContext();

    const isOnAdminPage = location.pathname.includes('/app-store/admin');

    // Apps: the "Your Apps" home, one app's status page, and the editor
    const isOnAppsPage =
        location.pathname === '/app-store/developer' ||
        location.pathname.startsWith('/app-store/developer/apps/') ||
        location.pathname.startsWith('/app-store/developer/submit') ||
        location.pathname.endsWith('/listing');

    // Build: projects and their dashboards, guides, and power-user listing tools
    const isOnBuildPage =
        !isOnAppsPage &&
        (location.pathname.startsWith('/app-store/developer/build') ||
            location.pathname.includes('/integrations') ||
            location.pathname.includes('/guides'));

    const goToMyApps = () => navigate('/app-store/developer');

    const handlePortalToggle = () => {
        if (isOnAdminPage) {
            navigate('/app-store/developer');
        } else {
            navigate('/app-store/admin');
        }
    };

    return (
        <AppHeader className="ion-no-border overflow-visible!">
            <AppToolbar className="shadow-none! border-b border-gray-200 overflow-visible! [&>.toolbar-container]:overflow-visible!">
                <div className="flex items-center justify-between px-2 sm:px-4 py-2 overflow-visible">
                    <button
                        onClick={() => navigate('/launchpad')}
                        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb"
                            alt="LearnCard"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
                        />

                        <span
                            className={`text-lg font-semibold text-gray-700 ${
                                rightContent ? 'hidden sm:block' : ''
                            }`}
                        >
                            {title || m['developerPortal.components.appStoreHeader.title']()}
                        </span>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-3 overflow-visible">
                        {rightContent}

                        {/* Navigation tabs */}
                        <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
                            <button
                                onClick={goToMyApps}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    isOnAppsPage
                                        ? 'bg-white text-gray-800 shadow-xs'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Code2 className="w-4 h-4" />
                                {m['developerPortal.components.appStoreHeader.apps']()}
                            </button>

                            <button
                                onClick={goToIntegrationHub}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    isOnBuildPage
                                        ? 'bg-white text-gray-800 shadow-xs'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Hammer className="w-4 h-4" />
                                {m['developerPortal.components.appStoreHeader.build']()}
                            </button>
                        </div>

                        {/* Mobile nav toggle for guides */}
                        <button
                            onClick={() => {
                                if (isOnBuildPage) {
                                    goToMyApps();
                                } else {
                                    goToIntegrationHub();
                                }
                            }}
                            className="sm:hidden flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isOnBuildPage ? (
                                <Code2 className="w-4 h-4" />
                            ) : (
                                <Hammer className="w-4 h-4" />
                            )}
                        </button>

                        {isAdmin && (
                            <button
                                onClick={handlePortalToggle}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {isOnAdminPage ? (
                                    <>
                                        <Code2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">
                                            {m[
                                                'developerPortal.components.appStoreHeader.developer'
                                            ]()}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        <span className="hidden sm:inline">
                                            {m['developerPortal.components.appStoreHeader.admin']()}
                                        </span>
                                    </>
                                )}
                            </button>
                        )}

                        <AccountSwitcher />
                    </div>
                </div>
            </AppToolbar>
        </AppHeader>
    );
};

export default AppStoreHeader;
