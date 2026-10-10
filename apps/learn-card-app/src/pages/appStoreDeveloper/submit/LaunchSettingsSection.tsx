import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, ellipseOutline, warningOutline } from 'ionicons/icons';
import type { LaunchType } from '@learncard/types';

import { LaunchConfigStep } from '../components/LaunchConfigStep';
import { LISTING_TYPES } from '../apps/listingTypes';
import {
    getAddressProblem,
    getLaunchAddress,
    getLaunchSummary,
    parseLaunchConfig,
} from './launchSettings';
import { AddressGuidance } from './AddressGuidance';

export interface LaunchSettings {
    type: LaunchType;
    configJson: string;
}

interface LaunchSettingsSectionProps {
    value: LaunchSettings;
    onChange: (value: LaunchSettings) => void;
    /** Apps published from their own code: only the address is editable here. */
    managedByApp: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    error?: string | null;
    /** Moves an unpublishable address (localhost, a builder preview) into this device's test address. */
    onKeepForTesting?: (address: string) => void;
    sectionRef?: React.RefObject<HTMLDivElement>;
}

export const LaunchSettingsSection: React.FC<LaunchSettingsSectionProps> = ({
    value,
    onChange,
    managedByApp,
    open,
    onOpenChange,
    error,
    sectionRef,
    onKeepForTesting,
}) => {
    const config = parseLaunchConfig(value.configJson);
    const [addressDraft, setAddressDraft] = useState(config.url ?? '');
    // Settings typed for each type, so trying another type and coming back loses nothing.
    const [settingsByType, setSettingsByType] = useState<Partial<Record<LaunchType, string>>>({
        [value.type]: value.configJson,
    });
    const [typeChange, setTypeChange] = useState<'locked' | 'confirming' | 'unlocked'>(
        managedByApp ? 'locked' : 'unlocked'
    );

    const address = getLaunchAddress(value.type, config);
    const addressProblem = getAddressProblem(address);

    const selectType = (type: LaunchType) => {
        if (type === value.type) return;
        const remembered = { ...settingsByType, [value.type]: value.configJson };
        setSettingsByType(remembered);
        onChange({ type, configJson: remembered[type] ?? '{}' });
    };

    return (
        <div
            ref={sectionRef}
            tabIndex={-1}
            className="bg-white rounded-[20px] border border-grayscale-200 overflow-hidden outline-none mb-6"
        >
            <div className="p-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-grayscale-900">How it opens</h2>
                    <p className="text-sm text-grayscale-600 mt-0.5 break-words">
                        {getLaunchSummary(value.type, config)}
                    </p>
                    {error && !open && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
                </div>
                <button
                    type="button"
                    onClick={() => onOpenChange(!open)}
                    aria-expanded={open}
                    className="shrink-0 py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    {open ? 'Done' : 'Change'}
                </button>
            </div>

            {open && (
                <div className="px-6 pb-6 pt-5 border-t border-grayscale-100 space-y-5">
                    {managedByApp && typeChange !== 'unlocked' && (
                        <div>
                            <label
                                htmlFor="managed-app-address"
                                className="block text-xs font-medium text-grayscale-700 mb-1.5"
                            >
                                Where your app lives
                            </label>
                            <input
                                id="managed-app-address"
                                type="url"
                                value={addressDraft}
                                onChange={e => {
                                    setAddressDraft(e.target.value);
                                    onChange({
                                        ...value,
                                        configJson: JSON.stringify({
                                            ...config,
                                            url: e.target.value.trim(),
                                        }),
                                    });
                                }}
                                placeholder="https://myapp.com"
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            />
                            <p className="mt-2 text-xs text-grayscale-500">
                                Permissions and features are set by your app. Publish again from
                                your app to update them.
                            </p>
                        </div>
                    )}

                    {managedByApp && typeChange === 'locked' && (
                        <button
                            type="button"
                            onClick={() => setTypeChange('confirming')}
                            className="text-xs text-grayscale-500 hover:text-grayscale-700 transition-colors"
                        >
                            Change how it opens…
                        </button>
                    )}

                    {managedByApp && typeChange === 'confirming' && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <div className="flex items-start gap-2.5">
                                <IonIcon
                                    icon={warningOutline}
                                    className="text-amber-600 text-lg mt-0.5 shrink-0"
                                />
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    Your app was built to run inside LearnCard. Changing how it
                                    opens will stop signing in, credentials, and its other LearnCard
                                    features from working.
                                </p>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTypeChange('locked')}
                                    className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                                >
                                    Keep It
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTypeChange('unlocked')}
                                    className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                >
                                    Change Anyway
                                </button>
                            </div>
                        </div>
                    )}

                    {typeChange === 'unlocked' && (
                        <>
                            <div>
                                <p className="text-xs font-medium text-grayscale-700 mb-2">
                                    How does it work?
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {LISTING_TYPES.map(option => {
                                        const selected = option.type === value.type;
                                        return (
                                            <button
                                                key={option.type}
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() => selectType(option.type)}
                                                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-colors ${
                                                    selected
                                                        ? 'border-grayscale-900 bg-grayscale-10'
                                                        : 'border-grayscale-200 hover:border-grayscale-300'
                                                }`}
                                            >
                                                <IonIcon
                                                    icon={
                                                        selected ? checkmarkCircle : ellipseOutline
                                                    }
                                                    className={`text-lg shrink-0 mt-0.5 ${
                                                        selected
                                                            ? 'text-emerald-500'
                                                            : 'text-grayscale-300'
                                                    }`}
                                                />
                                                <span className="text-sm font-medium text-grayscale-900">
                                                    {option.title}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <LaunchConfigStep
                                key={value.type}
                                data={{
                                    launch_type: value.type,
                                    launch_config_json: value.configJson,
                                }}
                                onChange={next =>
                                    onChange({
                                        type: next.launch_type ?? value.type,
                                        configJson: next.launch_config_json ?? value.configJson,
                                    })
                                }
                                errors={{}}
                                fieldsOnly
                            />
                        </>
                    )}
                    {addressProblem && address ? (
                        <AddressGuidance
                            address={address}
                            problem={addressProblem}
                            onKeepForTesting={
                                onKeepForTesting &&
                                value.type === 'EMBEDDED_IFRAME' &&
                                (addressProblem === 'local' || addressProblem === 'preview')
                                    ? () => {
                                          onKeepForTesting(address);
                                          setAddressDraft('');
                                          const remembered = {
                                              ...settingsByType,
                                              [value.type]: JSON.stringify({ ...config, url: '' }),
                                          };
                                          setSettingsByType(remembered);
                                          onChange({
                                              ...value,
                                              configJson: remembered[value.type] ?? '{}',
                                          });
                                      }
                                    : undefined
                            }
                        />
                    ) : (
                        error && <p className="text-xs text-red-600">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
};
