import React from 'react';
import SadCloud from '../../svgs/SadCloud';

import { useHistory } from 'react-router-dom';
import { useGetCurrentLCNUser } from 'learn-card-base';
import { LaunchPadAppListItem } from 'learn-card-base';
import { VC } from '@learncard/types';
import { AiPassportAppsEnum } from '../../ai-passport-apps/aiPassport-apps.helpers';

type AiApp = LaunchPadAppListItem & { url: string };

export const AiSessionsEmptyState: React.FC<{
    topicsTitle: string;
    topicBoost?: VC;
    app?: AiApp;
    primaryColor?: string;
}> = ({ topicsTitle, topicBoost, app, primaryColor }) => {
    const history = useHistory();
    const { currentLCNUser } = useGetCurrentLCNUser();

    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-6">
            <SadCloud className="w-[120px] h-auto text-grayscale-300 mb-4" />
            <h3 className="text-[20px] font-semibold text-grayscale-900">
                No sessions for this topic
            </h3>
            <p className="text-grayscale-600 mt-2 max-w-[520px] text-sm leading-relaxed">
                You don't have any sessions for "{topicsTitle}" yet. Start a new one to begin
                chatting about this topic.
            </p>
            <button
                className={`mt-6 bg-${primaryColor} hover:bg-${primaryColor} text-white px-5 py-3 rounded-[20px] font-semibold text-sm shadow-soft-bottom disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!topicBoost?.uri}
                onClick={() => {
                    const uri = topicBoost?.uri;
                    if (!uri) return;

                    if (app?.type === AiPassportAppsEnum.learncardapp) {
                        history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
                    } else if (app?.url) {
                        window.location.href = `${app.url}/chats?topicUri=${encodeURIComponent(
                            uri
                        )}&did=${encodeURIComponent(currentLCNUser?.did ?? '')}`;
                    } else {
                        history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
                    }
                }}
            >
                Start a new session
            </button>
        </div>
    );
};

export default AiSessionsEmptyState;
