import React, { useRef, useState } from 'react';
import { IonContent, IonPage, IonRow, IonCol } from '@ionic/react';

import {
    BrandingEnum,
    LearnCard,
    LearnCardActivityList,
    isPlatformAndroid,
    isPlatformWeb,
} from 'learn-card-base';

import UserF from '../../assets/images/f-user.png';
import MainHeader from '../../components/main-header/MainHeader';

const LearnCardPage: React.FC = () => {
    const [isActivityHeaderFixed, setIsActivityHeaderFixed] = useState<boolean>(false);
    const activityContainer = useRef<HTMLIonRowElement>(null);

    const activityHeader = (
        <IonRow className="w-full flex items-center justify-center">
            <IonCol className="flex items-center justify-between w-full z-10 max-w-[500px]">
                <h2 className="text-grayscale-900 font-bold text-lg">Recent Activity</h2>
                <button className="text-grayscale-900 font-bold text-lg">View All</button>
            </IonCol>
        </IonRow>
    );

    return (
        <IonPage className="bg-white">
            <MainHeader customClassName="bg-white" branding={BrandingEnum.scoutPass}>
                {isActivityHeaderFixed && activityHeader}
            </MainHeader>
            <IonContent
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
                class="learn-card-card-content"
                color="cyan-100"
            >
                <LearnCard userImage={UserF} />
                {activityHeader}
                <LearnCardActivityList ref={activityContainer} />
            </IonContent>
        </IonPage>
    );
};

export default LearnCardPage;
