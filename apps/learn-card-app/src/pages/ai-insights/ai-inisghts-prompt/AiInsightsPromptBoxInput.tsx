import React from 'react';

import { m } from '../../../paraglide/messages.js';

import { AppTextarea } from '../../../components/controls/AppTextarea';

export const AiInsightsPromptBoxInput: React.FC<{
    prompt: string;
    setPrompt: (prompt: string) => void;
}> = ({ prompt, setPrompt }) => {
    return (
        <div className="w-full">
            <AppTextarea
                value={prompt}
                onValueInput={value => {
                    setPrompt(value);
                }}
                placeholder={m['aiInsights.askAboutSkills']()}
                className="w-full font-notoSans text-left bg-indigo-50 px-4 rounded-[10px] text-grayscale-900 text-[17px]"
                autoGrow
                rows={2}
            />
        </div>
    );
};

export default AiInsightsPromptBoxInput;
