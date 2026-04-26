import React from 'react';
import { Play } from 'lucide-react';

import type { Scenario, ProviderId } from '../scenarios';

export interface ScenarioCardProps {
    scenario: Scenario;
    selectedProvider: ProviderId;
    onLaunch: (scenario: Scenario) => void;
    isLaunching: boolean;
    isLaunched: boolean;
}

/**
 * Single scenario tile in the Issuance / Verification grid. Greys
 * itself out when the selected provider hasn\u2019t implemented the
 * scenario \u2014 keeps the catalogue honest about coverage gaps.
 */
const ScenarioCard: React.FC<ScenarioCardProps> = ({
    scenario,
    selectedProvider,
    onLaunch,
    isLaunching,
    isLaunched,
}) => {
    const supported = scenario.supportedProviders.includes(selectedProvider);
    const disabled = !supported || isLaunching;

    return (
        <div
            className={`rounded-2xl border p-5 flex flex-col gap-3 transition-colors ${
                supported
                    ? 'bg-white border-grayscale-200 hover:border-grayscale-300'
                    : 'bg-grayscale-100 border-grayscale-200 opacity-60'
            } ${isLaunched ? 'ring-2 ring-emerald-400' : ''}`}
        >
            <div>
                <h3 className="text-base font-semibold text-grayscale-900">
                    {scenario.name}
                </h3>
                <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                    {scenario.description}
                </p>
            </div>

            <div className="text-xs text-grayscale-500 leading-relaxed">
                <span className="font-medium text-grayscale-700">Exercises:</span>{' '}
                {scenario.exercises}
            </div>

            {!supported && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                    Not yet implemented for this provider.
                </p>
            )}

            <button
                onClick={() => onLaunch(scenario)}
                disabled={disabled}
                className="mt-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {isLaunching ? (
                    <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Launching\u2026
                    </>
                ) : (
                    <>
                        <Play className="w-3.5 h-3.5" />
                        {isLaunched ? 'Re-launch' : 'Launch'}
                    </>
                )}
            </button>
        </div>
    );
};

export default ScenarioCard;
