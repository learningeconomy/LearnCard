import React from 'react';

import { IonPage, IonContent } from '@ionic/react';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { useTenantBrandingAssets } from '../../config/brandingAssets';

interface LegalPageLayoutProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
    const branding = useBrandingConfig();
    const assets = useTenantBrandingAssets();

    return (
        <IonPage>
            <IonContent
                fullscreen
                className="font-poppins"
                style={{ '--background': '#ffffff' } as React.CSSProperties}
            >
                <header className="sticky top-0 z-10 bg-white border-b border-grayscale-200 px-6 py-4">
                    <div className="max-w-3xl mx-auto flex items-center gap-3">
                        <img
                            src={assets.brandMark}
                            alt={branding.name}
                            className="h-8 w-8 object-contain"
                        />

                        <span className="text-sm font-semibold text-grayscale-900">
                            {branding.name}
                        </span>
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-6 py-10">
                    <h1 className="text-2xl font-semibold text-grayscale-900 mb-1">
                        {title}
                    </h1>

                    <p className="text-xs text-grayscale-500 mb-8">
                        Last Updated: {lastUpdated}
                    </p>

                    <div className="legal-content text-sm text-grayscale-700 leading-relaxed space-y-6">
                        {children}
                    </div>

                    <footer className="mt-16 pt-6 border-t border-grayscale-200 text-xs text-grayscale-400">
                        <p>
                            {branding.name} is powered by Learning Economy Foundation, LLC — a
                            U.S.-based 501(c)(3) nonprofit dedicated to learner agency and data
                            sovereignty.
                        </p>

                        <p className="mt-2">
                            Contact: <a href="mailto:privacy@learningeconomy.io" className="underline hover:text-grayscale-600">privacy@learningeconomy.io</a>
                        </p>
                    </footer>
                </main>
            </IonContent>
        </IonPage>
    );
};

export default LegalPageLayout;
