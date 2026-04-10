import React from 'react';
import { Capacitor } from '@capacitor/core';

import useTheme from '../../theme/hooks/useTheme';

const UserProfileSetupHeader: React.FC<{
    showNetworkSettings?: boolean;
    handleNetworkPrompt: () => void;
    handleNotificationsPrompt: () => void;
}> = ({
    showNetworkSettings = false,
    handleNetworkPrompt = () => {},
    handleNotificationsPrompt = () => {},
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="ion-no-border bg-white pt-5">
            {showNetworkSettings && (
                <div className="w-full flex items-center justify-center">
                    {Capacitor?.isNativePlatform?.() && (
                        <button
                            onClick={() => handleNotificationsPrompt?.()}
                            className={`mr-1 text-${primaryColor} font-semibold text-lg text-center`}
                        >
                            Notifications
                        </button>
                    )}
                    {/* {!currentLCNUser && (
                            <button
                                onClick={() => handleNetworkPrompt?.()}
                                className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                            >
                                <span className="text-indigo-500"> • </span>Permissions&nbsp;
                            </button>
                        )}

                        {!currentLCNUser && (
                            <button
                                onClick={() => handleNetworkPrompt?.()}
                                className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                            >
                                <span className="text-indigo-500"> • </span>Permissions
                            </button>
                        )}

                        <button
                            onClick={() => presentMyDataModal?.()}
                            className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                        >
                            <span className="text-indigo-500"> • </span>My Data
                        </button> */}
                </div>
            )}
        </div>
    );
};

export default UserProfileSetupHeader;
