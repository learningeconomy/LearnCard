import React from 'react';
import { IonIcon } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';

import { m } from '../../../../paraglide/messages.js';

export type ActiveAiSessionPromptProps = {
    activeThreadTitle?: string;
    isResuming: boolean;
    isStartingNew: boolean;
    onResume: () => void;
    onStartNew: () => void;
};

export const ActiveAiSessionPrompt: React.FC<ActiveAiSessionPromptProps> = ({
    activeThreadTitle,
    isResuming,
    isStartingNew,
    onResume,
    onStartNew,
}) => {
    const isBusy = isResuming || isStartingNew;
    const title = activeThreadTitle || m['aiSession.activeFallbackTitle']();

    return (
        <div className="sticky bottom-0 z-50 w-full bg-white p-4 fade-enter">
            <section
                aria-labelledby="active-ai-session-title"
                className="mx-auto w-full max-w-[480px] rounded-[20px] border border-amber-100 bg-amber-50 p-5 font-poppins shadow-soft-bottom"
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <IonIcon icon={timeOutline} className="text-xl" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                        <h2
                            id="active-ai-session-title"
                            className="text-lg font-semibold text-grayscale-900"
                        >
                            {m['aiSession.activeTitle']()}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                            {m['aiSession.activeDescription']({ title })}
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onResume}
                        disabled={isBusy}
                        className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isResuming && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {isResuming
                            ? m['aiSession.resumingSession']()
                            : m['aiSession.resumeSession']()}
                    </button>

                    <button
                        type="button"
                        onClick={onStartNew}
                        disabled={isBusy}
                        className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 bg-white px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isStartingNew && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-grayscale-300 border-t-grayscale-700" />
                        )}
                        {isStartingNew
                            ? m['aiSession.startingNewSession']()
                            : m['aiSession.startNewSession']()}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ActiveAiSessionPrompt;
