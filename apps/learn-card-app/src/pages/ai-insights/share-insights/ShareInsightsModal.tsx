import React, { useCallback, useState } from 'react';

import X from 'learn-card-base/svgs/X';
import { IonInput } from '@ionic/react';
import { IonSpinner } from '@ionic/react';
import AiInsightsUserCard from '../AiInsightsUserCard';
import ShareInsightsWithAnyoneController from './ShareInsightsWithAnyoneController';

import {
    useModal,
    useGetConnections,
    useGetSearchProfiles,
    switchedProfileStore,
} from 'learn-card-base';

import { AiInsightsUserCardMode } from '../ai-insights.helpers';

import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';

export const ShareInsightsModal: React.FC = () => {
    const profileType = switchedProfileStore.use.profileType();
    const isChild = profileType === 'child';

    const { getIconSet } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const { floatingBottle: FloatingBottleIcon } = icons;

    const { closeModal } = useModal();

    const [search, setSearch] = useState<string>('');
    const handleSearch = useCallback((value: string) => setSearch(value), []);

    const { data: connections = [] } = useGetConnections();
    const { data: searchResults, isLoading: loading } = useGetSearchProfiles(search);

    const isSearching = search.length > 0;
    const showLoadingSpinner = loading && isSearching;
    const showSearchResults = !loading && isSearching && searchResults && searchResults.length > 0;
    const showNoSearchResults =
        !loading && isSearching && (!searchResults || searchResults.length === 0);

    return (
        <div className="h-full w-full flex items-start justify-center overflow-y-auto bg-white relative">
            <div className="w-full max-w-[600px]">
                {/* header */}
                <div className="w-full ion-padding flex flex-col gap-2">
                    <div className="w-full flex items-center justify-between">
                        <h1 className="text-3xl text-indigo-500 font-semibold">Share Insights</h1>
                        <button
                            type="button"
                            onClick={() => closeModal()}
                            className="bg-grayscale-200 p-3 rounded-full h-[45px] w-[45px] flex items-center justify-center"
                        >
                            <X className="text-grayscale-900 h-[45px] w-[45px]" />
                        </button>
                    </div>
                    <p className="text-grayscale-700 text-sm">
                        Share your Top Skills, Learning Snapshots, and Suggested Pathways. You will
                        also be able to receive learning pathway suggestions.
                    </p>
                </div>

                {/* request button */}
                {!isChild && <ShareInsightsWithAnyoneController />}

                {/* search  */}
                <div className="flex items-center justify-start w-full ion-padding">
                    <IonInput
                        autocapitalize="on"
                        placeholder="Search by name..."
                        value={search}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base"
                        onIonInput={e => handleSearch(e?.detail?.value)}
                        debounce={500}
                        type="text"
                        clearInput
                    />
                </div>

                {/* search results && contacts */}
                <div className="w-full px-4">
                    <div className="w-full flex flex-col items-center justify-between">
                        <p className="text-grayscale-900 text-lg font-semibold border-b border-grayscale-200 pb-4 w-full">
                            Contacts
                        </p>
                        <div className="w-full flex flex-col gap-2">
                            {showLoadingSpinner && (
                                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full mt-8">
                                    <IonSpinner color="grayscale-900" />
                                    <p className="mt-2 font-bold text-lg">Loading...</p>
                                </section>
                            )}

                            {showSearchResults &&
                                searchResults?.map((profile, index) => (
                                    <AiInsightsUserCard
                                        key={index}
                                        profile={profile}
                                        mode={AiInsightsUserCardMode.Share}
                                    />
                                ))}

                            {!isSearching &&
                                connections?.length > 0 &&
                                connections?.map((profile, index) => (
                                    <AiInsightsUserCard
                                        key={index}
                                        profile={profile}
                                        mode={AiInsightsUserCardMode.Share}
                                    />
                                ))}

                            {!isSearching && connections?.length === 0 && (
                                <section className="flex flex-col items-center justify-center my-[30px]">
                                    <FloatingBottleIcon />
                                    <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                                        No Contacts
                                    </p>
                                </section>
                            )}
                        </div>

                        {showNoSearchResults && (
                            <section className="flex flex-col items-center justify-center my-[30px]">
                                <FloatingBottleIcon />
                                <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                                    No Search Results
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareInsightsModal;
