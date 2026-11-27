import React, { useRef, useState } from 'react';
import * as m from '../../paraglide/messages.js';
import { AppCol, AppRow } from '../../components/layout';

import {
    LearnCard,
    LearnCardActivityList,
    isPlatformAndroid,
    isPlatformWeb,
} from 'learn-card-base';

import UserF from '../../assets/images/f-user.png';
import MainHeader from '../../components/main-header/MainHeader';
import { AppContent, AppPage } from '../../components/chrome';

const LearnCardWalletPage: React.FC = () => {
    const [isActivityHeaderFixed, setIsActivityHeaderFixed] = useState<boolean>(false);
    const activityContainer = useRef<HTMLIonRowElement>(null);

    const activityHeader = (
        <AppRow className="w-full flex items-center justify-center">
            <AppCol className="flex items-center justify-between w-full z-10 max-w-[500px]">
                <h2 className="text-grayscale-900 font-bold text-lg">Recent Activity</h2>
                <button className="text-grayscale-900 font-bold text-lg">
                    {m['common.viewAll']()}
                </button>
            </AppCol>
        </AppRow>
    );

    return (
        <AppPage className="bg-white">
            <MainHeader customClassName="bg-white">
                {isActivityHeaderFixed && activityHeader}
            </MainHeader>
            <AppContent
                fullscreen
                scrollEvents={true}
                onIonScroll={event => {
                    const platformOffset = isPlatformWeb() || isPlatformAndroid() ? -65 : 0;
                    if (
                        (activityContainer?.current?.offsetTop ?? 0) + platformOffset <=
                        event?.detail?.scrollTop
                    ) {
                        setIsActivityHeaderFixed(true);
                    } else {
                        setIsActivityHeaderFixed(false);
                    }
                }}
                className="learn-card-card-content"
                color="cyan-100"
            >
                <LearnCard userImage={UserF} />
                {activityHeader}
                <LearnCardActivityList ref={activityContainer} />
            </AppContent>
        </AppPage>
    );
};

export default LearnCardWalletPage;
