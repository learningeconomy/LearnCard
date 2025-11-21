import React from 'react';

import { useGetCurrentLCNUser } from 'learn-card-base';

const UserProfileSetupHeader: React.FC<{
    showNetworkSettings?: boolean;
    handleNetworkPrompt: () => void;
    handleNotificationsPrompt: () => void;
}> = ({
    showNetworkSettings = false,
    handleNetworkPrompt = () => {},
    handleNotificationsPrompt = () => {},
}) => {
    const { currentLCNUser } = useGetCurrentLCNUser();

    return (
        <div className="ion-no-border bg-white pt-5">
            {showNetworkSettings && (
                <div className="w-full flex items-center justify-center">
                    <button
                        onClick={() => handleNotificationsPrompt?.()}
                        className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                    >
                        Notifications
                    </button>
                    {/* {!currentLCNUser && (
                        <button
                            onClick={() => handleNetworkPrompt?.()}
                            className="mr-1 text-indigo-500 font-semibold text-lg text-center"
                        >
                            <span className="text-indigo-500"> • </span>Permissions&nbsp;
                        </button>
                    )} */}
                </div>
            )}
        </div>
    );
};

export default UserProfileSetupHeader;
