import React from 'react';

import X from '../../svgs/X';
import BurgerIcon from '../../svgs/Burger';
import { IonMenuToggle } from '@ionic/react';
import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import LearnCardTextLogo from '../../svgs/LearnCardTextLogo';
import LearnCardLogo from '../../../assets/images/lca-icon-v2.png';

import sideMenuStore from 'learn-card-base/stores/sideMenuStore';

import { LaunchPadAppListItem } from 'learn-card-base';

import { useTheme } from '../../../theme/hooks/useTheme';

export const AiSessionsDesktopHeader: React.FC<{
    app?: LaunchPadAppListItem;
}> = ({ app }) => {
    const isCollapsed = sideMenuStore.useTracked.isCollapsed();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    let img = LearnCardLogo;
    if (app) img = app.img;

    return (
        <div className="flex flex-col items-center justify-center absolute bg-white backdrop-blur-[5px] w-full top-0 left-0 z-[100]">
            <div className="w-full flex flex-col max-w-[600px] relative ion-padding !pt-6">
                <div className="w-full flex items-center justify-between px-2">
                    <IonMenuToggle
                        onClick={() => {
                            sideMenuStore.set.isCollapsed(!isCollapsed);
                        }}
                        menu="appSideMenu"
                        autoHide={false}
                        role="button"
                    >
                        <div className="max-w-[90%] flex items-center justify-center relative h-[25px] w-[25px]">
                            <BurgerIcon
                                className={`absolute top-0 left-0 h-[25px] w-[25px] text-grayscale-800 transition-all duration-300 ease-in-out ${
                                    isCollapsed
                                        ? 'opacity-100 scale-100 rotate-0'
                                        : 'opacity-0 scale-90 rotate-45 pointer-events-none'
                                }`}
                            />
                            <X
                                className={`absolute top-0 left-0 h-[25px] w-[25px] text-grayscale-800 transition-all duration-300 ease-in-out ${
                                    isCollapsed
                                        ? 'opacity-0 scale-90 -rotate-45 pointer-events-none'
                                        : 'opacity-100 scale-100 rotate-0'
                                }`}
                            />
                        </div>
                    </IonMenuToggle>
                    <LearnCardTextLogo className="text-grayscale-900 w-[85%] max-w-[150px]" />
                    <div className="h-[25px] w-[25px]" />
                </div>

                <div className="w-full flex items-center justify-center">
                    <h4 className={`font-semibold text-${primaryColor} text-sm mt-1`}>
                        AI Sessions
                    </h4>
                </div>
            </div>

            <div className="w-full flex flex-col items-center justify-center relative bg-white">
                <div className="w-full flex items-center justify-center relative mb-[-3.4px]">
                    <IDSleeve className="h-auto w-full rotate-180" />
                </div>

                <div className="absolute bg-white min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] rounded-full mb-6 shadow-soft-bottom top-[10px] overflow-hidden border-solid border-white border-[3px]">
                    <img className="w-full h-full object-cover" alt="LearnCard logo" src={img} />
                </div>
            </div>
        </div>
    );
};

export default AiSessionsDesktopHeader;
