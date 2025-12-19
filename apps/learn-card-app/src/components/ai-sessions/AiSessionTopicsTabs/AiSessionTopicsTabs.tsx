import React, { useMemo } from 'react';

import AiSessionsSearch from '../AiSessionsSearch/AiSessionsSearch';

import {
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from '../AiSessionsSearch/aiSessions-search.helpers';
import { aiSessiontTabs, AiSessionsTabsEnum } from '../aiSessions.helpers';
import { aiPassportApps, AiPassportAppsEnum } from '../../ai-passport-apps/aiPassport-apps.helpers';
import {
    pluralize,
    useGetAllAiTopicCredentials,
    useModal,
    ModalTypes,
    useDeviceTypeByWidth,
} from 'learn-card-base';
import { IonSpinner } from '@ionic/react';
import AiPassportPersonalizationContainer from '../../ai-passport/AiPassportPersonalizationContainer';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';
import {
    NewAiSessionButton,
    NewAiSessionButtonEnum,
} from '../../new-ai-session/NewAiSessionButton/NewAiSessionButton';

type AiSessionsTabsProps = {
    activeTab: AiSessionsTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<AiSessionsTabsEnum>>;

    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;
    filterBy: AiSessionsFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<AiSessionsFilterOptionsEnum>>;
    sortBy: AiSessionsSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<AiSessionsSortOptionsEnum>>;
};

export const AiSessionsTabs: React.FC<AiSessionsTabsProps> = ({
    activeTab,
    setActiveTab,
    searchInput,
    setSearchInput,
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
}) => {
    const { data: aiTopics, isLoading } = useGetAllAiTopicCredentials();
    const { newModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();

    const topicsCount = useMemo(() => {
        if (activeTab === AiSessionsTabsEnum.chatGPT) {
            const chatGPTProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.chatGPT
            );
            return (
                aiTopics?.filter(topics => topics?.contractUri === chatGPTProfile?.contractUri)
                    .length ?? 0
            );
        } else if (activeTab === AiSessionsTabsEnum.claude) {
            const claudeProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.claude
            );
            return (
                aiTopics?.filter(topics => topics?.contractUri === claudeProfile?.contractUri)
                    .length ?? 0
            );
        } else if (activeTab === AiSessionsTabsEnum.gemini) {
            const geminiProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.gemini
            );
            return (
                aiTopics?.filter(topics => topics?.contractUri === geminiProfile?.contractUri)
                    .length ?? 0
            );
        } else if (activeTab === AiSessionsTabsEnum.learnCard) {
            const learncardappProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.learncardapp
            );
            return (
                aiTopics?.filter(topics => topics?.contractUri === learncardappProfile?.contractUri)
                    .length ?? 0
            );
        }
        return aiTopics?.length ?? 0;
    }, [activeTab, aiTopics]);

    const handlePersonalizeMyAi = () => {
        newModal(
            <AiPassportPersonalizationContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    return (
        <div className="w-full ml-2 px-2">
            <div className="w-full flex items-center justify-between">
                <h2 className="text-grayscale-500 font-semibold text-[25px] flex items-center">
                    {isLoading ? (
                        <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
                    ) : (
                        topicsCount
                    )}
                    &nbsp;{pluralize('Topic', topicsCount)}
                </h2>
                {isMobile && (
                    <button
                        onClick={handlePersonalizeMyAi}
                        className="bg-white text-grayscale-700 flex items-center justify-center p-3 py-[5px] rounded-[15px] font-semibold text-[14px] mr-4 border-[1px] border-solid border-grayscale-200"
                    >
                        <UnicornIcon className="w-[35px] h-auto mr-2" />
                        Personalize
                    </button>
                )}
            </div>
            {/* <div className="w-full flex items-center justify-start overflow-x-auto mt-2">
                {aiSessiontTabs.map((tab, index) => {
                    const isActive = activeTab === tab?.type;

                    return (
                        <button
                            key={index}
                            onClick={() => setActiveTab(tab?.type)}
                            type="button"
                            className={`mr-2 border-solid  border-indigo-300 rounded-full px-4 py-[2px] font-semibold text-base ${
                                isActive
                                    ? 'text-indigo-500 border-[1px]'
                                    : 'text-grayscale-600 border-0'
                            }`}
                        >
                            {tab.title}
                        </button>
                    );
                })}
            </div> */}
            <AiSessionsSearch
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                filterBy={filterBy}
                setFilterBy={setFilterBy}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />
            {isMobile && <NewAiSessionButton type={NewAiSessionButtonEnum.mobile} />}
        </div>
    );
};

export default AiSessionsTabs;
