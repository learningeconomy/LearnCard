import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonItem } from '@ionic/react';

import useTheme from '../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../theme/colors';

export const LaunchPadBecomeAnApp: React.FC = () => {
    const history = useHistory();
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.launchPad);

    const buttonClass = `flex items-center justify-center rounded-full font-[600] rounded-full px-[20px] py-[5px] normal text-sm font-poppins ${colors?.buttons?.unconnected}`;

    const handleClick = () => {
        history.push('/app-store/developer');
    };

    return (
        <IonItem
            lines="none"
            className="w-full max-w-[600px] ion-no-border px-[12px] py-[12px] max-h-[76px] border-gray-200 border-b-2 last:border-b-0 flex  bg-white items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-sm"
        >
            <div className="flex items-center justify-start w-full bg-white">
                <div className="rounded-lg shadow-3xl overflow-hidden w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                    <img
                        className="w-full h-full object-cover bg-white rounded-lg overflow-hidden"
                        src={'https://cdn.filestackcontent.com/34lUXCrGRlGp33M51v2F'}
                    />
                </div>
                <div className="right-side flex justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left">
                        <p className="text-grayscale-900 font-medium line-clamp-1">Your App Here</p>
                        <p className="text-grayscale-600 font-medium text-[12px] line-clamp-1">
                            Create Your Own Apps
                        </p>
                    </div>

                    <div className="flex app-connect-btn-container items-center min-w-[109px]">
                        <button className={buttonClass} onClick={handleClick}>
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </IonItem>
    );
};

export default LaunchPadBecomeAnApp;
