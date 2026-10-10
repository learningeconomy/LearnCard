import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
    arrowForwardOutline,
    checkmarkCircle,
    checkmarkOutline,
    codeSlashOutline,
    copyOutline,
    ellipseOutline,
    openOutline,
    rocketOutline,
    sparklesOutline,
} from 'ionicons/icons';

import { openExternalLink } from '../../../../helpers/externalLinkHelpers';
import { DEVELOPER_DOCS_URL } from '../../apps/NewAppSheet';
import type { GuideProps } from '../GuidePage';
import { useGuideState } from '../shared/useGuideState';
import {
    APP_FEATURES,
    DEFAULT_FEATURES,
    INSTALL_COMMAND,
    buildStarterCode,
    buildStarterPrompt,
} from './starterKit';
import type { AppFeatureId } from './starterKit';

const STEPS = [
    { id: 'make', label: 'Make it' },
    { id: 'try', label: 'Try it' },
    { id: 'publish', label: 'Publish it' },
] as const;

const STEP_IDS: readonly string[] = STEPS.map(step => step.id);

/** Progress saved by the earlier 6-step version of this guide; those projects start over. */
const isLegacyProgress = (currentStep: number, completedSteps: string[]): boolean =>
    currentStep >= STEPS.length || completedSteps.some(id => !STEP_IDS.includes(id));

const PRIMARY =
    'py-3 px-5 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 inline-flex items-center justify-center gap-2';
const SECONDARY =
    'py-3 px-5 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors inline-flex items-center justify-center gap-2';

const CopyBlock: React.FC<{ text: string; label: string; mono?: boolean }> = ({
    text,
    label,
    mono = true,
}) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard can be blocked; the text stays visible to copy by hand.
        }
    };

    return (
        <div className="rounded-2xl bg-grayscale-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <span className="text-xs font-medium text-white/60">{label}</span>
                <button
                    type="button"
                    onClick={copy}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors"
                >
                    <IonIcon icon={copied ? checkmarkOutline : copyOutline} />
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre
                className={`p-4 text-sm text-white/90 whitespace-pre-wrap break-words max-h-80 overflow-y-auto ${
                    mono ? 'font-mono' : 'font-poppins leading-relaxed'
                }`}
            >
                {text}
            </pre>
        </div>
    );
};

const Stepper: React.FC<{ current: number; onSelect: (step: number) => void }> = ({
    current,
    onSelect,
}) => (
    <ol className="flex items-center gap-2 mb-8">
        {STEPS.map((step, index) => (
            <li key={step.id} className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onSelect(index)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium transition-colors ${
                        index === current
                            ? 'bg-grayscale-900 text-white'
                            : index < current
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-grayscale-100 text-grayscale-500'
                    }`}
                >
                    {index < current ? (
                        <IonIcon icon={checkmarkOutline} />
                    ) : (
                        <span>{index + 1}</span>
                    )}
                    {step.label}
                </button>
                {index < STEPS.length - 1 && <span className="w-4 h-px bg-grayscale-300" />}
            </li>
        ))}
    </ol>
);

const MakeStep: React.FC<{
    idea: string;
    features: AppFeatureId[];
    onIdeaChange: (idea: string) => void;
    onToggleFeature: (id: AppFeatureId) => void;
}> = ({ idea, features, onIdeaChange, onToggleFeature }) => {
    const [mode, setMode] = useState<'ai' | 'code'>('ai');

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-grayscale-900">Make your app</h2>
                <p className="text-sm text-grayscale-600 mt-1">
                    Tell us a little, and we'll hand you everything to get started.
                </p>
            </div>

            <div>
                <label
                    htmlFor="app-idea"
                    className="block text-xs font-medium text-grayscale-700 mb-1.5"
                >
                    What's your app about?
                </label>
                <input
                    id="app-idea"
                    type="text"
                    value={idea}
                    onChange={e => onIdeaChange(e.target.value)}
                    placeholder="e.g. a quiz game that helps kids practice fractions"
                    maxLength={200}
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
            </div>

            <div>
                <p className="text-xs font-medium text-grayscale-700 mb-2">
                    What should it do with LearnCard?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {APP_FEATURES.map(feature => {
                        const on = features.includes(feature.id);
                        return (
                            <button
                                key={feature.id}
                                type="button"
                                aria-pressed={on}
                                onClick={() => onToggleFeature(feature.id)}
                                className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors ${
                                    on
                                        ? 'border-grayscale-900 bg-grayscale-10'
                                        : 'border-grayscale-200 hover:border-grayscale-300'
                                }`}
                            >
                                <IonIcon
                                    icon={on ? checkmarkCircle : ellipseOutline}
                                    className={`text-xl shrink-0 mt-0.5 ${
                                        on ? 'text-emerald-500' : 'text-grayscale-300'
                                    }`}
                                />
                                <span>
                                    <span className="block text-sm font-medium text-grayscale-900">
                                        {feature.title}
                                    </span>
                                    <span className="block text-xs text-grayscale-500 mt-0.5">
                                        {feature.description}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div className="flex items-center gap-1 p-1 bg-grayscale-100 rounded-full w-fit mb-4">
                    {(
                        [
                            ['ai', 'With AI', sparklesOutline],
                            ['code', 'With code', codeSlashOutline],
                        ] as const
                    ).map(([id, label, icon]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setMode(id)}
                            className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                                mode === id
                                    ? 'bg-grayscale-900 text-white'
                                    : 'text-grayscale-700 hover:bg-grayscale-200'
                            }`}
                        >
                            <IonIcon icon={icon} />
                            {label}
                        </button>
                    ))}
                </div>

                {mode === 'ai' ? (
                    <div className="space-y-3">
                        <p className="text-sm text-grayscale-600">
                            Paste this into Lovable, Bolt, v0, or any AI app builder.
                        </p>
                        <CopyBlock
                            label="Starter prompt"
                            text={buildStarterPrompt(idea, features)}
                            mono={false}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-grayscale-600">
                            Works with any web app: React, Vue, plain HTML, and more.
                        </p>
                        <CopyBlock label="Install" text={INSTALL_COMMAND} />
                        <CopyBlock label="Use it" text={buildStarterCode(features)} />
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={() => openExternalLink(DEVELOPER_DOCS_URL)}
                className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors inline-flex items-center gap-1"
            >
                Prefer to set things up by hand? See the docs
                <IonIcon icon={openOutline} />
            </button>
        </div>
    );
};

const TRY_POINTS = [
    "Every LearnCard action shows a small pop-up explaining what would happen. Nothing real is sent while you're testing.",
    'A panel in the bottom-left corner lists everything your app has used so far.',
    'Points, credentials, and permissions are remembered between reloads, so you can test real flows.',
];

const TryStep: React.FC = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-xl font-semibold text-grayscale-900">Try it in the preview</h2>
            <p className="text-sm text-grayscale-600 mt-1">
                Open your app's preview in your AI builder, or run it on your computer. There's
                nothing to set up.
            </p>
        </div>
        <ul className="space-y-3">
            {TRY_POINTS.map(point => (
                <li key={point} className="flex items-start gap-3">
                    <IonIcon
                        icon={checkmarkCircle}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-grayscale-700 leading-relaxed">{point}</span>
                </li>
            ))}
        </ul>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800 leading-relaxed">
            Don't see the pop-ups? Make sure your app calls one of the LearnCard actions above, and
            that it's running in your builder's preview or on localhost.
        </div>
    </div>
);

const PublishStep: React.FC<{ onDone: () => void }> = ({ onDone }) => (
    <div className="space-y-6">
        <div>
            <h2 className="text-xl font-semibold text-grayscale-900">Publish to LearnCard</h2>
            <p className="text-sm text-grayscale-600 mt-1">
                Once your app has done a couple of things, a <strong>Publish to LearnCard</strong>{' '}
                button appears in the panel at the bottom-left of your app.
            </p>
        </div>
        <ol className="space-y-3">
            {[
                'Click Publish to LearnCard in your app.',
                'Add your store details: icon, description, screenshots.',
                "Submit for review. We'll let you know when it's live.",
            ].map((text, index) => (
                <li key={text} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-grayscale-100 text-grayscale-700 text-xs font-medium flex items-center justify-center shrink-0">
                        {index + 1}
                    </span>
                    <span className="text-sm text-grayscale-700 leading-relaxed pt-0.5">
                        {text}
                    </span>
                </li>
            ))}
        </ol>
        <p className="text-sm text-grayscale-500">
            Your app shows up in Your Apps as soon as you start publishing. Everything LearnCard
            needs, like credential designs and permissions, is set up for you.
        </p>
        <button type="button" onClick={onDone} className={PRIMARY}>
            <IonIcon icon={rocketOutline} />
            Go to Your Apps
        </button>
    </div>
);

const EmbedAppQuickGuide: React.FC<GuideProps> = ({ selectedIntegration }) => {
    const history = useHistory();
    const guide = useGuideState('embed-app', STEPS.length, selectedIntegration);
    const legacy = isLegacyProgress(guide.currentStep, guide.state.completedSteps);
    const current = legacy ? 0 : guide.currentStep;
    const { resetGuide } = guide;

    useEffect(() => {
        if (legacy) resetGuide();
    }, [legacy, resetGuide]);
    const idea = guide.getConfig<string>('appIdea', '') ?? '';
    const features =
        guide.getConfig<AppFeatureId[]>('appFeatures', DEFAULT_FEATURES) ?? DEFAULT_FEATURES;

    const toggleFeature = (id: AppFeatureId) =>
        guide.updateConfig(
            'appFeatures',
            features.includes(id) ? features.filter(feature => feature !== id) : [...features, id]
        );

    const next = () => {
        guide.markStepComplete(STEPS[current].id);
        guide.goToStep(current + 1);
    };

    return (
        <div className="max-w-2xl mx-auto py-6 font-poppins animate-fade-in-up">
            <Stepper current={current} onSelect={guide.goToStep} />

            {current === 0 && (
                <MakeStep
                    idea={idea}
                    features={features}
                    onIdeaChange={value => guide.updateConfig('appIdea', value)}
                    onToggleFeature={toggleFeature}
                />
            )}
            {current === 1 && <TryStep />}
            {current === 2 && <PublishStep onDone={() => history.push('/app-store/developer')} />}

            {current < STEPS.length - 1 && (
                <div className="mt-10 flex items-center justify-between">
                    {current > 0 ? (
                        <button
                            type="button"
                            onClick={() => guide.goToStep(current - 1)}
                            className={SECONDARY}
                        >
                            Back
                        </button>
                    ) : (
                        <span />
                    )}
                    <button type="button" onClick={next} className={PRIMARY}>
                        {current === 0 ? "I've Started My App" : "It's Working"}
                        <IonIcon icon={arrowForwardOutline} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmbedAppQuickGuide;
