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
                <div className="flex flex-col items-center w-full gap-6 px-4 pb-8">
                    <div className="flex items-center justify-between w-full max-w-[820px] pt-4 gap-3">
                        <h1 className="font-poppins font-semibold text-[36px] text-[#18224E]">
                            My Apps
                        </h1>
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search..."
                            className="flex-1 max-w-[320px] rounded-full bg-grayscale-100 px-4 py-2 font-poppins"
                            aria-label="Search apps"
                        />
                        <button
                            type="button"
                            onClick={() => history.push('/launchpad/browse?tab=All')}
                            className="rounded-full border border-indigo-600 text-indigo-600 font-poppins font-semibold px-4 py-2 whitespace-nowrap"
                        >
                            Browse More +
                        </button>
                    </div>

                    <AppGrid heading="LearnCard Apps">
                        {LEARNCARD_APP_SHORTCUTS.map(s => (
                            <AppGridTile
                                key={s.key}
                                title={s.title}
                                icon={<s.Icon />}
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
