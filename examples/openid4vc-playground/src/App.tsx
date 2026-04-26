import React, { useState } from 'react';
import { Download, Send } from 'lucide-react';

import ScenarioCard from './components/ScenarioCard';
import LaunchPanel from './components/LaunchPanel';
import { launchScenario, type LaunchSuccess } from './api';
import {
    PROVIDERS,
    SCENARIOS,
    filterScenarios,
    type ProviderId,
    type Scenario,
    type ScenarioKind,
} from './scenarios';

type LaunchState =
    | { kind: 'idle' }
    | { kind: 'launching'; scenarioId: string }
    | { kind: 'launched'; scenarioId: string; launch: LaunchSuccess }
    | { kind: 'error'; scenarioId: string; message: string };

const App: React.FC = () => {
    const [tab, setTab] = useState<ScenarioKind>('vci');
    const [providerId, setProviderId] = useState<ProviderId>('waltid');
    const [launchState, setLaunchState] = useState<LaunchState>({ kind: 'idle' });

    const handleLaunch = async (scenario: Scenario) => {
        setLaunchState({ kind: 'launching', scenarioId: scenario.id });
        try {
            const launch = await launchScenario(providerId, scenario.id);
            setLaunchState({ kind: 'launched', scenarioId: scenario.id, launch });
        } catch (err) {
            setLaunchState({
                kind: 'error',
                scenarioId: scenario.id,
                message:
                    err instanceof Error
                        ? err.message
                        : 'Failed to launch scenario.',
            });
        }
    };

    const visibleScenarios = filterScenarios(tab, providerId);
    const allScenarios = SCENARIOS.filter((s) => s.kind === tab);

    const launchedScenario =
        launchState.kind === 'launched'
            ? allScenarios.find((s) => s.id === launchState.scenarioId)
            : undefined;

    return (
        <div className="min-h-screen bg-grayscale-10">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 min-w-0 space-y-5">
                        <ProviderPicker
                            providerId={providerId}
                            onChange={setProviderId}
                        />

                        <Tabs tab={tab} onChange={setTab} />

                        {launchState.kind === 'error' && (
                            <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-800">
                                {launchState.message}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allScenarios.map((s) => (
                                <ScenarioCard
                                    key={s.id}
                                    scenario={s}
                                    selectedProvider={providerId}
                                    onLaunch={handleLaunch}
                                    isLaunching={
                                        launchState.kind === 'launching'
                                        && launchState.scenarioId === s.id
                                    }
                                    isLaunched={
                                        launchState.kind === 'launched'
                                        && launchState.scenarioId === s.id
                                    }
                                />
                            ))}
                        </div>

                        {visibleScenarios.length === 0 && (
                            <div className="p-4 rounded-2xl bg-grayscale-100 border border-grayscale-200 text-sm text-grayscale-600">
                                No scenarios are implemented for this provider yet.
                            </div>
                        )}
                    </div>

                    {launchState.kind === 'launched' && launchedScenario && (
                        <div className="lg:w-[360px] lg:shrink-0">
                            <LaunchPanel
                                launch={launchState.launch}
                                scenario={launchedScenario}
                                providerId={providerId}
                                onClose={() => setLaunchState({ kind: 'idle' })}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const Header: React.FC = () => (
    <header className="border-b border-grayscale-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
            <div>
                <h1 className="text-xl font-semibold text-grayscale-900">
                    OID4VC Playground
                </h1>
                <p className="text-xs text-grayscale-500 mt-0.5">
                    Curated issuance &amp; verification scenarios for the LearnCard wallet
                </p>
            </div>
            <a
                href="https://github.com/learningeconomy/LearnCard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-grayscale-500 hover:text-grayscale-900 transition-colors"
            >
                LearnCard \u2197
            </a>
        </div>
    </header>
);

const Tabs: React.FC<{
    tab: ScenarioKind;
    onChange: (k: ScenarioKind) => void;
}> = ({ tab, onChange }) => (
    <div className="inline-flex p-1 rounded-full bg-grayscale-100 gap-1">
        <TabButton
            active={tab === 'vci'}
            onClick={() => onChange('vci')}
            icon={<Download className="w-3.5 h-3.5" />}
            label="Issuance"
        />
        <TabButton
            active={tab === 'vp'}
            onClick={() => onChange('vp')}
            icon={<Send className="w-3.5 h-3.5" />}
            label="Verification"
        />
    </div>
);

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            active
                ? 'bg-grayscale-900 text-white'
                : 'text-grayscale-700 hover:bg-grayscale-200'
        }`}
    >
        {icon}
        {label}
    </button>
);

const ProviderPicker: React.FC<{
    providerId: ProviderId;
    onChange: (id: ProviderId) => void;
}> = ({ providerId, onChange }) => (
    <div className="bg-white rounded-2xl border border-grayscale-200 p-4">
        <label
            htmlFor="provider-picker"
            className="text-xs font-medium text-grayscale-700 mb-1.5 block uppercase tracking-wide"
        >
            Provider
        </label>
        <select
            id="provider-picker"
            value={providerId}
            onChange={(e) => onChange(e.target.value as ProviderId)}
            className="w-full text-sm text-grayscale-900 bg-white border border-grayscale-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
            {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.enabled}>
                    {p.name}
                    {!p.enabled ? ' (coming soon)' : ''}
                </option>
            ))}
        </select>
        <p className="text-xs text-grayscale-500 mt-1.5">
            {PROVIDERS.find((p) => p.id === providerId)?.blurb}
        </p>
    </div>
);

export default App;
