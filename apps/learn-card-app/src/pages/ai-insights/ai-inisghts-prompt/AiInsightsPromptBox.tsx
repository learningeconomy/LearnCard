import React, { useState } from 'react';

import AiInsightsPromptBoxInput from './AiInsightsPromptBoxInput';

export const AiInsightsPromptBox: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');

    const promptIsEmpty = !prompt || prompt.trim() === '';

    const handleSubmitPrompt = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (promptIsEmpty) return;
        console.log(prompt);
    };

    return (
        <form
            onSubmit={handleSubmitPrompt}
            className="w-full items-center justify-center flex flex-col gap-4"
        >
            <AiInsightsPromptBoxInput prompt={prompt} setPrompt={setPrompt} />
            <button
                disabled={promptIsEmpty}
                type="submit"
                className={`text-xl text-white flex items-center justify-center font-semibold px-4 py-[12px] rounded-full shadow-soft-bottom w-full ${
                    promptIsEmpty ? 'bg-grayscale-600 opacity-50' : 'bg-indigo-600'
                }`}
            >
                Let's Go!
            </button>
        </form>
    );
};

export default AiInsightsPromptBox;
