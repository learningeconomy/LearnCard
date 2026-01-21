import React, { useState } from 'react';

import AiInsightsPromptBoxInput from './AiInsightsPromptBoxInput';

import useTheme from '../../../theme/hooks/useTheme';

export const AiInsightsPromptBoxContainer: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleSubmitPrompt = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!prompt || prompt.trim() === '') return;
        console.log(prompt);
    };

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px] gap-4 mt-4">
            <form
                onSubmit={handleSubmitPrompt}
                className="w-full items-center justify-center flex flex-col gap-4"
            >
                <AiInsightsPromptBoxInput prompt={prompt} setPrompt={setPrompt} />
                <button
                    type="submit"
                    className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold px-4 py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px]`}
                >
                    Let's Go!
                </button>
            </form>
        </div>
    );
};

export default AiInsightsPromptBoxContainer;
