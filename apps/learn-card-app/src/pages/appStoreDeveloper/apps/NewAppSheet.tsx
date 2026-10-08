import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    arrowBackOutline,
    chatbubblesOutline,
    chevronForwardOutline,
    closeOutline,
    desktopOutline,
    linkOutline,
    openOutline,
    serverOutline,
    shieldCheckmarkOutline,
    sparklesOutline,
    storefrontOutline,
} from 'ionicons/icons';
import type { LaunchType } from '@learncard/types';

import { Overlay } from 'learn-card-base';

export const DEVELOPER_DOCS_URL = 'https://docs.learncard.com/reference/partner-connect';

export const LISTING_TYPES: Array<{
    type: LaunchType;
    title: string;
    description: string;
    icon: string;
}> = [
    {
        type: 'DIRECT_LINK',
        title: 'Opens in a new tab',
        description: 'Send people to your website.',
        icon: linkOutline,
    },
    {
        type: 'CONSENT_REDIRECT',
        title: 'Connects, then goes to your site',
        description: 'People share info with you, then land on your site.',
        icon: shieldCheckmarkOutline,
    },
    {
        type: 'AI_TUTOR',
        title: 'AI tutor',
        description: 'A tutor that helps learners with what they know.',
        icon: chatbubblesOutline,
    },
    {
        type: 'SECOND_SCREEN',
        title: 'Pairs with a second screen',
        description: 'Runs on another device, like a classroom display.',
        icon: desktopOutline,
    },
    {
        type: 'SERVER_HEADLESS',
        title: 'Runs on a server',
        description: 'No screen. Your service works with LearnCard behind the scenes.',
        icon: serverOutline,
    },
];

interface NewAppSheetProps {
    onClose: () => void;
    onBuildApp: () => void;
    onListExisting: (type: LaunchType) => void;
    onOpenDocs: () => void;
}

const ChoiceRow: React.FC<{
    icon: string;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="group w-full flex items-center gap-4 p-4 text-left rounded-2xl border border-grayscale-200 hover:border-grayscale-300 hover:bg-grayscale-10 transition-colors"
    >
        <span className="w-10 h-10 rounded-xl bg-grayscale-100 flex items-center justify-center shrink-0">
            <IonIcon icon={icon} className="text-lg text-grayscale-700" />
        </span>
        <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-grayscale-900">{title}</span>
            <span className="block text-xs text-grayscale-500 mt-0.5">{description}</span>
        </span>
        <IonIcon
            icon={chevronForwardOutline}
            className="text-grayscale-400 group-hover:text-grayscale-700 transition-colors shrink-0"
        />
    </button>
);

export const NewAppSheet: React.FC<NewAppSheetProps> = ({
    onClose,
    onBuildApp,
    onListExisting,
    onOpenDocs,
}) => {
    const [view, setView] = useState<'start' | 'existing'>('start');

    return (
        <Overlay onDismiss={onClose}>
            <div className="p-6 sm:p-8 text-left">
                <div className="flex items-center justify-between mb-5">
                    {view === 'existing' ? (
                        <button
                            type="button"
                            onClick={() => setView('start')}
                            className="flex items-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            <IonIcon icon={arrowBackOutline} />
                            Back
                        </button>
                    ) : (
                        <span />
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-grayscale-500 hover:bg-grayscale-100 transition-colors"
                    >
                        <IonIcon icon={closeOutline} className="text-xl" />
                    </button>
                </div>

                {view === 'start' ? (
                    <>
                        <h2 className="text-xl font-semibold text-grayscale-900">New app</h2>
                        <p className="text-sm text-grayscale-600 mt-1 mb-6">
                            Where are you starting from?
                        </p>

                        <button
                            type="button"
                            onClick={onBuildApp}
                            className="group w-full text-left rounded-2xl bg-grayscale-900 p-5 hover:opacity-95 transition-opacity"
                        >
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80">
                                <IonIcon icon={sparklesOutline} />
                                Recommended
                            </span>
                            <span className="block mt-2 text-base font-semibold text-white">
                                Build an app
                            </span>
                            <span className="block mt-1 text-sm text-white/70 leading-relaxed">
                                Make it in Lovable, Bolt, v0, or your own code. It runs inside
                                LearnCard.
                            </span>
                        </button>

                        <div className="mt-3">
                            <ChoiceRow
                                icon={storefrontOutline}
                                title="List something you already have"
                                description="A website, AI tutor, or service that connects to LearnCard."
                                onClick={() => setView('existing')}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={onOpenDocs}
                            className="mt-6 w-full flex items-center justify-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            Read the developer docs
                            <IonIcon icon={openOutline} />
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            How does it work?
                        </h2>
                        <p className="text-sm text-grayscale-600 mt-1 mb-5">
                            Pick the one closest to what you have.
                        </p>
                        <div className="space-y-2">
                            {LISTING_TYPES.map(option => (
                                <ChoiceRow
                                    key={option.type}
                                    icon={option.icon}
                                    title={option.title}
                                    description={option.description}
                                    onClick={() => onListExisting(option.type)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Overlay>
    );
};
