import React from 'react';

import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';

import useTheme from '../../../../theme/hooks/useTheme';

export const StartAiSessionButton: React.FC<{ handleStartSession?: () => void }> = ({
    handleStartSession,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="w-full bg-white items-center justify-center ion-padding flex fade-enter bottom-0 sticky z-50">
            <button
                onClick={handleStartSession}
                className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom mb-4 max-w-[375px]`}
            >
                Start
                <NewAiSessionIcon className="ml-1" />
            </button>
        </div>
    );
};

export default StartAiSessionButton;
