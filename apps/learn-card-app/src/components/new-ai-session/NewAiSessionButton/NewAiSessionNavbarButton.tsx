import React from 'react';

import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';

import useTheme from '../../../theme/hooks/useTheme';

export const NewAiSessionNavbarButton: React.FC<{ handleNewSession?: () => void }> = ({
    handleNewSession,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <button onClick={handleNewSession} className="new-ai-sessions-button">
            <div
                className={`bg-${primaryColor} relative rounded-full h-[90px] w-[90px] flex items-center justify-center flex-col border-solid border-[3px] border-grayscale-100`}
            >
                <NewAiSessionIcon className="w-[44px] h-[44px]" />
            </div>
        </button>
    );
};

export default NewAiSessionNavbarButton;
