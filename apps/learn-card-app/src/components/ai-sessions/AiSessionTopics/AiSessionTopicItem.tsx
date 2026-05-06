import { useHistory } from 'react-router-dom';

import SlimCaretRight from '../../svgs/SlimCaretRight';

import { aiPassportApps } from '../../ai-passport-apps/aiPassport-apps.helpers';
import type { Boost, VC } from '@learncard/types';
import { getAiTopicTitle } from '../../new-ai-session/newAiSession.helpers';

export const AiSessionTopicItem: React.FC<{
    topicRecord?: { contractUri?: string };
    topicBoost?: Boost;
    topicVc?: VC;
    topicTitleOverride?: string;
    topicSubtitleOverride?: string;
    providerLogoUrls?: string[];
    topicSessionsCount: number;
    hasUnfinishedSessions?: boolean;
    hasFinishedSessions?: boolean;
    onSelectTopic?: () => void;
}> = ({
    topicRecord,
    topicBoost,
    topicVc,
    topicTitleOverride,
    topicSubtitleOverride,
    providerLogoUrls,
    topicSessionsCount,
    hasUnfinishedSessions,
    onSelectTopic,
}) => {
    const history = useHistory();

    const app = aiPassportApps?.find(appItem => appItem?.contractUri === topicRecord?.contractUri);
    const topicTitle = topicTitleOverride ?? getAiTopicTitle(topicVc) ?? '';
    const appLogos = (
        providerLogoUrls?.length ? providerLogoUrls : [app?.img, topicVc?.image]
    ).filter(Boolean) as string[];
    const uniqueLogos = Array.from(new Set(appLogos)).slice(0, 4);

    return (
        <button
            type="button"
            onClick={() => {
                if (onSelectTopic) return onSelectTopic();
                history.push(
                    `/ai/sessions?topicBoostUri=${encodeURIComponent(topicBoost?.uri ?? '')}`
                );
            }}
            className="flex items-center justify-between w-full bg-white rounded-2xl shadow-sm px-4 py-3 mb-3"
        >
            <div className="flex items-center justify-start flex-1 min-w-0">
                <div className="w-[42px] h-[42px] shrink-0">
                    {uniqueLogos.length > 1 ? (
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                            {Array.from({ length: 4 }).map((_, idx) => {
                                const logo = uniqueLogos[idx];
                                if (!logo) {
                                    return (
                                        <div
                                            key={`empty-${idx}`}
                                            className="w-full h-full rounded-[6px] bg-white aspect-square"
                                        />
                                    );
                                }

                                return (
                                    <img
                                        key={`${logo}-${idx}`}
                                        className="w-full h-full object-cover bg-white rounded-[6px] overflow-hidden border border-grayscale-200 aspect-square"
                                        alt="AI tool logo"
                                        src={logo}
                                    />
                                );
                            })}
                        </div>
                    ) : uniqueLogos.length === 1 ? (
                        <img
                            className="w-full h-full object-cover bg-white rounded-[10px] overflow-hidden border border-grayscale-200 aspect-square"
                            alt="AI tool logo"
                            src={uniqueLogos[0]}
                        />
                    ) : (
                        <div className="w-full h-full rounded-[10px] border border-grayscale-200 bg-grayscale-100 aspect-square" />
                    )}
                </div>
                <div className="flex flex-col items-start justify-center ml-3 min-w-0">
                    <p className="text-grayscale-900 text-[17px] font-poppins font-semibold capitalize text-left line-clamp-1">
                        {topicTitle}
                    </p>
                    {topicSubtitleOverride ? (
                        <p className="text-grayscale-500 text-[13px] font-poppins font-normal text-left line-clamp-1">
                            {topicSubtitleOverride}
                        </p>
                    ) : app?.name ? (
                        <p className="text-grayscale-500 text-[13px] font-poppins font-normal text-left line-clamp-1">
                            With {app.name}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center justify-end gap-1 shrink-0 ml-3 text-grayscale-600 font-poppins text-sm">
                {hasUnfinishedSessions && (
                    <span className="w-[8px] h-[8px] rounded-full bg-rose-500 shrink-0" />
                )}
                <span>{topicSessionsCount}</span>
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </div>
        </button>
    );
};

export default AiSessionTopicItem;
