import React from 'react';

import { IonTextarea } from '@ionic/react';

export const AiInsightsPromptBoxInput: React.FC<{
    prompt: string;
    setPrompt: (prompt: string) => void;
}> = ({ prompt, setPrompt }) => {
    return (
        <div className="w-full">
            <IonTextarea
                value={prompt}
                onIonInput={e => {
                    setPrompt(e.detail.value as string);
                }}
                placeholder="Ask about your skills or your future..."
                className="w-full font-notoSans text-left bg-indigo-50 px-4 rounded-[10px] text-grayscale-900 text-[17px]"
                autoGrow
                rows={2}
            />
        </div>
    );
};

export default AiInsightsPromptBoxInput;
