import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { useModal } from 'learn-card-base';

import MainHeader from '../../components/main-header/MainHeader';
import AppStoreDetailModal from '../launchPad/AppStoreDetailModal';
import AppGrid from './AppGrid';
import AppGridTile from './AppGridTile';
import { LEARNCARD_APP_SHORTCUTS } from './learnCardAppShortcuts';
import useOpenBoostTemplateSelector from './useOpenBoostTemplateSelector';
import useMoreApps from './useMoreApps';

const DEEP_LINK_PARAMS = ['connectTo', 'uri', 'embedUrl'];

const MyAppsLanding: React.FC = () => {
    const history = useHistory();
    const { search } = useLocation();
    const { newModal } = useModal();
    const openBoost = useOpenBoostTemplateSelector();
    const { apps: moreApps, isSuggested } = useMoreApps();
    const [searchInput, setSearchInput] = useState('');

    // Preserve existing /launchpad deep-link flows by handing them to the browse view.
    useEffect(() => {
        const params = new URLSearchParams(search);
        if (DEEP_LINK_PARAMS.some(p => params.has(p))) {
            history.replace(`/launchpad/browse${search}`);
        }
    }, [search, history]);

    const helpers = useMemo(
        () => ({ push: (path: string) => history.push(path), openBoost }),
        [history, openBoost]
    );

    const filteredMoreApps = useMemo(() => {
        const q = searchInput.trim().toLowerCase();
        if (!q) return moreApps;
        return moreApps.filter(
            a => a.display_name?.toLowerCase().includes(q) || a.tagline?.toLowerCase().includes(q)
        );
    }, [moreApps, searchInput]);

    return (
        <IonPage className="bg-white">
            <MainHeader />
            <IonContent fullscreen color="grayscale-100">
                <div className="flex w-full flex-col items-center gap-8 px-4 pb-10 pt-4 md:gap-12">
                    <div className="flex w-full max-w-[820px] flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        <div className="flex items-center justify-between gap-3 md:contents">
                            <h1 className="font-poppins text-[28px] font-semibold text-[#18224E] md:order-1 md:text-[30px]">
                                My Apps
                            </h1>
                            <button
                                type="button"
                                onClick={() => history.push('/launchpad/browse?tab=All')}
                                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#E2E3E9] bg-[#FBFBFC] px-4 py-2.5 font-poppins text-[15px] font-medium text-[#6366F1] md:order-3 md:text-[17px]"
                            >
                                Browse More <span className="text-[18px] leading-none">+</span>
                            </button>
                        </div>
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search..."
                            aria-label="Search apps"
                            className="w-full rounded-[10px] bg-[#E2E3E9] px-4 py-2.5 font-notoSans text-[16px] text-[#18224E] placeholder:text-[#6F7590] focus:outline-none md:order-2 md:max-w-[320px] md:flex-1"
                        />
                    </div>

                    <AppGrid heading="LearnCard Apps">
                        {LEARNCARD_APP_SHORTCUTS.map(s => (
                            <AppGridTile
                                key={s.key}
                                title={s.title}
                                icon={<s.Icon className="h-full w-full" />}
                                gradientFrom={s.gradientFrom}
                                gradientTo={s.gradientTo}
                                onClick={s.getAction(helpers)}
                            />
                        ))}
                    </AppGrid>

                    <AppGrid heading="More Apps">
                        {filteredMoreApps.map(app => (
                            <AppGridTile
                                key={app.listing_id}
                                title={app.display_name}
                                icon={app.icon_url}
                                onClick={() =>
                                    newModal(
                                        <AppStoreDetailModal
                                            listing={app}
                                            isInstalled={!isSuggested}
                                        />
                                    )
                                }
                            />
                        ))}
                    </AppGrid>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default MyAppsLanding;
