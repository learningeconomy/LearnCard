import React from 'react';

import { IonContent, IonPage } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';

import {
    BrandingEnum,
    CredentialCategoryEnum,
    CurvedBackdropEl,
    categoryMetadata,
} from 'learn-card-base';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';

const CurrenciesPage: React.FC = () => {
    const imgSrc = categoryMetadata[CredentialCategoryEnum.currency].defaultImageSrc;
    return (
        <IonPage className="bg-cyan-700">
            <MainHeader
                showBackButton
                subheaderType={SubheaderTypeEnum.Currency}
                branding={BrandingEnum.scoutPass}
            ></MainHeader>
            <IonContent fullscreen className="currencies-page" color={'cyan-700'}>
                <CurvedBackdropEl className="bg-cyan-300" />
                <section className="flex flex-col pt-[10px] px-[20px] text-center justify-center">
                    <img src={imgSrc} alt="currencies" className="relative max-w-[250px] m-auto" />
                    <strong className="relative">No currencies yet.</strong>
                </section>
            </IonContent>
        </IonPage>
    );
};

export default CurrenciesPage;
