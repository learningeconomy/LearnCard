import React from 'react';
import { useHistory } from 'react-router-dom';

import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import CheckListButton from '../../components/learncard/checklist/CheckListButton';

import { useIsLoggedIn } from 'learn-card-base';

export const AiPathwaysEmptyPlaceholder: React.FC = () => {
    const history = useHistory();
    const isLoggedIn = useIsLoggedIn();

    let title = isLoggedIn ? 'No AI Pathways yet.' : 'Join LearnCard\nto unlock AI Pathways';
    const text = isLoggedIn
        ? `Build your LearnCard to unlock personalized pathways to discover career routes and learning experiences aligned with your skills.`
        : 'AI Pathways connect your skills to relevant courses, careers, salaries, and learning content.';

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 px-[15px] py-[18px] rounded-[15px]">
            <div className="w-full flex-col flex items-center justify-center gap-4">
                <AiPathwaysIconWithShape className="w-auto h-[60px]" />
                <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-xl text-grayscale-800 font-notoSans text-center whitespace-pre-line">
                        {title}
                    </h2>
                    <p className="text-sm text-grayscale-700 font-notoSans text-center">{text}</p>
                </div>
                {isLoggedIn && <CheckListButton />}
                {!isLoggedIn && (
                    <button
                        onClick={() => {
                            history.push('/');
                        }}
                        className="p-[11px] bg-emerald-700 rounded-full text-white flex-1 font-poppins text-[17px] font-semibold w-full"
                    >
                        Join LearnCard
                    </button>
                )}
            </div>
        </div>
    );
};

export default AiPathwaysEmptyPlaceholder;
