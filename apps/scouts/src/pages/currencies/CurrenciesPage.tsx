import React from 'react';

import MainHeader from '../../components/main-header/MainHeader';

import {
    BrandingEnum,
    CredentialCategoryEnum,
    CurvedBackdropEl,
    categoryMetadata,
} from 'learn-card-base';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import * as m from '../../paraglide/messages.js';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';

const CurrenciesPage: React.FC = () => {
    const imgSrc = categoryMetadata[CredentialCategoryEnum.currency].defaultImageSrc;
    return (
        <AppPage className="bg-cyan-700">
            <MainHeader
                showBackButton
                subheaderType={SubheaderTypeEnum.Currency}
                branding={BrandingEnum.scoutPass}
            ></MainHeader>
            <AppContent fullscreen className="currencies-page" color={'cyan-700'}>
                <CurvedBackdropEl className="bg-cyan-300" />
                <section className="flex flex-col pt-[10px] px-[20px] text-center justify-center">
                    <img
                        src={imgSrc}
                        alt={m['currencies.altImg']()}
                        className="relative max-w-[250px] m-auto"
                    />
                    <strong className="relative">{m['currencies.none']()}</strong>
                </section>
            </AppContent>
        </AppPage>
    );
};

export default CurrenciesPage;
