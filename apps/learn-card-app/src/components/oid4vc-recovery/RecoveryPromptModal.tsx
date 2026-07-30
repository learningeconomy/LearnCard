import React from 'react';
import { Overlay, type UserPrompt } from 'learn-card-base';

interface RecoveryPromptModalProps {
    prompt: UserPrompt | null;
    onResolve: (accepted: boolean) => void;
}

const SEVERITY_HEADER_CLASS: Record<UserPrompt['severity'], string> = {
    info: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
};

export const RecoveryPromptModal: React.FC<RecoveryPromptModalProps> = ({
    prompt,
    onResolve,
}) => {
    if (!prompt) return null;

    return (
        <Overlay>
            <div className={`${SEVERITY_HEADER_CLASS[prompt.severity]} p-6 sm:rounded-t-[20px]`}>
                <h2 className="text-xl font-semibold text-white">{prompt.title}</h2>
            </div>
            <div className="p-6 sm:p-8 space-y-5">
                <p className="text-sm text-grayscale-600 leading-relaxed">{prompt.body}</p>
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => onResolve(true)}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        {prompt.cta}
                    </button>
                    {prompt.cancelCta && (
                        <button
                            type="button"
                            onClick={() => onResolve(false)}
                            className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            {prompt.cancelCta}
                        </button>
                    )}
                </div>
            </div>
        </Overlay>
    );
};
