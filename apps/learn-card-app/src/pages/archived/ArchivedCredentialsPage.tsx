import React from 'react';
import { IonContent, IonPage, IonRow } from '@ionic/react';
import { CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
import MainHeader from '../../components/main-header/MainHeader';
import EarnedAndManagedTabs, {
    CredentialListTabEnum,
} from '../../components/EarnedAndManagedTabs/EarnedAndManagedTabs';
import BoostEarnedList from '../../components/boost/boost-earned-card/BoostEarnedList';
import passportPageStore from '../../stores/passportPageStore';

const ArchivedCredentialsPage: React.FC = () => {
    const viewMode = passportPageStore.use.credentialViewMode();
    const setViewMode = passportPageStore.set.credentialViewMode;

    return (
        <IonPage className="bg-grayscale-100">
            <MainHeader showBackButton>
                <IonRow className="px-5 pb-3">
                    <h1 className="text-xl font-semibold text-grayscale-900">
                        {m['alerts.archived']()}
                    </h1>
                </IonRow>
            </MainHeader>
            <IonContent fullscreen className="bg-grayscale-100" color="grayscale-100">
                <EarnedAndManagedTabs
                    activeTab={CredentialListTabEnum.Earned}
                    handleActiveTab={() => undefined}
                    containerClassName="px-4"
                    showManaged={false}
                    showEarnedAndManaged={false}
                    showListViewToggle
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    category={CredentialCategoryEnum.achievement}
                    selectionContext="archived"
                />
                <BoostEarnedList
                    category="Archived"
                    viewMode={viewMode}
                    defaultImg={
                        categoryMetadata[CredentialCategoryEnum.achievement].defaultImageSrc
                    }
                    title={m['alerts.archived']()}
                />
            </IonContent>
        </IonPage>
    );
};

export default ArchivedCredentialsPage;
