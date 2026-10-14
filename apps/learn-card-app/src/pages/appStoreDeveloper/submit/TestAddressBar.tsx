import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { flaskOutline } from 'ionicons/icons';

import { displayHost, isValidTestAddress, type TestAddressState } from './testAddress';

interface TestAddressBarProps {
    test: TestAddressState;
    onChange: (next: TestAddressState) => void;
    /** The address used when no test address is on. */
    defaultAddress: string | null;
    /** Label for switching back to the default address. */
    resetLabel: string;
    className?: string;
}

export const TestAddressBar: React.FC<TestAddressBarProps> = ({
    test,
    onChange,
    defaultAddress,
    resetLabel,
    className = '',
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(test.address);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    const usingTest = test.enabled && isValidTestAddress(test.address);

    const applyDraft = () => {
        if (!isValidTestAddress(draft)) return;
        onChange({ address: draft.trim(), enabled: true });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <form
                className={`flex items-center gap-2 ${className}`}
                onSubmit={event => {
                    event.preventDefault();
                    applyDraft();
                }}
            >
                <input
                    type="url"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="http://localhost:5173"
                    ref={inputRef}
                    aria-label="Test address"
                    className="flex-1 min-w-0 py-2 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
                <button
                    type="submit"
                    disabled={!isValidTestAddress(draft)}
                    className="py-2 px-3 rounded-[20px] bg-grayscale-900 text-white font-medium text-xs hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                    Use
                </button>
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    Cancel
                </button>
            </form>
        );
    }

    return (
        <div className={`flex items-center justify-between gap-3 text-xs ${className}`}>
            {usingTest ? (
                <span className="flex items-center gap-1.5 min-w-0 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-medium">
                    <IonIcon icon={flaskOutline} className="shrink-0" />
                    <span className="truncate">Test address · {displayHost(test.address)}</span>
                </span>
            ) : defaultAddress ? (
                <span className="min-w-0 truncate text-grayscale-600">
                    Previewing <span className="font-medium">{displayHost(defaultAddress)}</span>
                </span>
            ) : (
                <span className="min-w-0 truncate text-grayscale-500">
                    No published address yet
                </span>
            )}
            <span className="flex items-center gap-3 shrink-0">
                {usingTest && defaultAddress && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...test, enabled: false })}
                        className="font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                    >
                        {resetLabel}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => {
                        setDraft(test.address);
                        setIsEditing(true);
                    }}
                    className="font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                >
                    {usingTest ? 'Edit' : 'Use a test address'}
                </button>
            </span>
        </div>
    );
};
