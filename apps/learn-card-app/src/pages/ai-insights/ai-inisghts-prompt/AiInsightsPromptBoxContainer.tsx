import React, { useState } from 'react';

import AiInsightsPromptBoxInput from './AiInsightsPromptBoxInput';
import AiInsightsPromptList from './ai-insights-prompt-list/AiInsightsPromptList';

export const AiInsightsPromptBoxContainer: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');

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
                    className={`bg-indigo-600 text-xl text-white flex items-center justify-center font-semibold px-4 py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px]`}
                >
                    Let's Go!
                </button>
            </form>

            <div className="h-[1px] bg-grayscale-200 w-full" />

            <AiInsightsPromptList />

            <div className="w-full flex items-center justify-center">
                <button className="text-grayscale-700 font-semibold">Explore more</button>
            </div>
        </div>
    );
};

export default AiInsightsPromptBoxContainer;
