import React from 'react';
import { useHistory } from 'react-router-dom';

import SlimCaretRight from '../../svgs/SlimCaretRight';
import AiSessionsContainer from '../../ai-sessions/AiSessionsContainer';

import { useModal, useDeviceTypeByWidth } from 'learn-card-base';

import { getAiTopicTitle } from '../../new-ai-session/newAiSession.helpers';

import { VC, Boost } from '@learncard/types';
import { ModalTypes } from 'learn-card-base';

export const TopicsItem: React.FC<{
    topicVc?: VC;
    topicBoost?: Boost;
    sessions?: Boost[];
}> = ({ topicVc, topicBoost, sessions }) => {
    const history = useHistory();
    const { newModal, closeModal, closeAllModals } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();

    const topicTitle = getAiTopicTitle(topicVc);

    return (
        <div
            role="button"
            onClick={() => {
                if (isDesktop) {
                    closeAllModals();
                    history.push(`/ai/sessions?topicBoostUri=${topicBoost?.uri}`);
                } else {
                    newModal(
                        <AiSessionsContainer
                            topicUri={topicBoost?.uri}
                            hideNavBar
                            handleGoBack={closeModal}
                        />,
                        { hideButton: true },
                        { mobile: ModalTypes.FullScreen, desktop: ModalTypes.Right }
                    );
                }
            }}
            className="flex items-center justify-between w-full bg-white pb-[12px] pt-[12px]"
        >
            <div className="flex items-center justify-start">
                <p className="text-grayscale-900 text-[17px] font-notoSans font-semibold capitalize">
                    {topicTitle}
                </p>
            </div>

            <div className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                <span>{sessions?.length}</span>{' '}
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </div>
        </div>
    );
};

export default TopicsItem;
