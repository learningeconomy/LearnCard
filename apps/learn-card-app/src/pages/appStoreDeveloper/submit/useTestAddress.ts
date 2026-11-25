import { useCallback, useEffect, useRef, useState } from 'react';

import {
    isValidTestAddress,
    readTestAddress,
    writeTestAddress,
    type TestAddressState,
} from './testAddress';

const EMPTY: TestAddressState = { address: '', enabled: false };

export interface UseTestAddressResult {
    test: TestAddressState;
    saveTest: (next: TestAddressState) => void;
    activeTestAddress: string | null;
}

/**
 * The test address saved in this browser for one app. When the key changes
 * (e.g. a draft app gets its listing id), an address set under the old key
 * carries over unless the new key already has one.
 */
export const useTestAddress = (storageKey: string | null): UseTestAddressResult => {
    const [test, setTest] = useState<TestAddressState>(() =>
        storageKey ? readTestAddress(storageKey) : EMPTY
    );
    const keyRef = useRef(storageKey);
    const testRef = useRef(test);
    testRef.current = test;

    useEffect(() => {
        if (keyRef.current === storageKey) return;
        keyRef.current = storageKey;
        if (!storageKey) return;

        const stored = readTestAddress(storageKey);
        if (!stored.address && testRef.current.address) {
            writeTestAddress(storageKey, testRef.current);
            return;
        }
        setTest(stored);
    }, [storageKey]);

    const saveTest = useCallback(
        (next: TestAddressState) => {
            setTest(next);
            if (storageKey) writeTestAddress(storageKey, next);
        },
        [storageKey]
    );

    const activeTestAddress =
        test.enabled && isValidTestAddress(test.address) ? test.address.trim() : null;

    return { test, saveTest, activeTestAddress };
};
