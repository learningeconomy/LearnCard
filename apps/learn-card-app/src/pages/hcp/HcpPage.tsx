import React, { useEffect, useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

import * as m from '../../paraglide/messages.js';
import ActivitySection from './ActivitySection';
import AppsSection from './AppsSection';
import HcpProfileGate from './HcpProfileGate';
import MyInfoSection from './MyInfoSection';

export const HCP_TABS = ['info', 'apps', 'activity'] as const;
export type HcpTab = (typeof HCP_TABS)[number];
const isTab = (value: string | null): value is HcpTab => HCP_TABS.some(tab => tab === value);

const tabLabel = (tab: HcpTab): string => {
    switch (tab) {
        case 'info':
            return m['hcp.tabs.info']();
        case 'apps':
            return m['hcp.tabs.apps']();
        case 'activity':
            return m['hcp.tabs.activity']();
        default: {
            const _exhaustive: never = tab;
            return _exhaustive;
        }
    }
};

export const HcpHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
    const history = useHistory();
    return (
        <header className="mb-5">
            <button
                type="button"
                aria-label={m['common.back']()}
                onClick={() =>
                    history.length > 1 ? history.goBack() : history.push('/privacy-and-data')
                }
                className="mb-3 text-grayscale-700"
            >
                <IonIcon icon={arrowBackOutline} className="text-2xl" />
            </button>
            <h1 className="text-[22px] font-semibold text-grayscale-900 mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-grayscale-600">{subtitle}</p>}
        </header>
    );
};

const HcpPage: React.FC = () => {
    const location = useLocation();
    const requested = new URLSearchParams(location.search).get('tab');
    const [tab, setTab] = useState<HcpTab>(isTab(requested) ? requested : 'info');
    // Ionic keeps this page mounted; follow a later link to another tab (e.g. after Allow).
    useEffect(() => {
        if (isTab(requested)) setTab(requested);
    }, [requested]);

    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="font-poppins mx-auto w-full max-w-[640px] px-5 pt-[max(24px,calc(var(--ion-safe-area-top,0px)+12px))] pb-14">
                    <HcpHeader title={m['hcp.title']()} subtitle={m['hcp.subtitle']()} />
                    <HcpProfileGate>
                        <div
                            role="tablist"
                            className="flex gap-1 p-1 mb-5 bg-grayscale-100 rounded-[20px]"
                        >
                            {HCP_TABS.map(item => (
                                <button
                                    key={item}
                                    type="button"
                                    role="tab"
                                    aria-selected={item === tab}
                                    onClick={() => setTab(item)}
                                    className={`flex-1 py-2 rounded-[20px] text-sm font-medium transition-colors ${
                                        item === tab
                                            ? 'bg-white text-grayscale-900 shadow-sm'
                                            : 'text-grayscale-600'
                                    }`}
                                >
                                    {tabLabel(item)}
                                </button>
                            ))}
                        </div>
                        <div role="tabpanel">
                            {tab === 'info' && <MyInfoSection />}
                            {tab === 'apps' && <AppsSection />}
                            {tab === 'activity' && <ActivitySection />}
                        </div>
                    </HcpProfileGate>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default HcpPage;
