const storageKey = (listingId: string) => `lc-test-address:${listingId}`;

export interface TestAddressState {
    address: string;
    enabled: boolean;
}

export const readTestAddress = (listingId: string): TestAddressState => {
    try {
        const raw = localStorage.getItem(storageKey(listingId));
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (
            parsed &&
            typeof parsed === 'object' &&
            typeof (parsed as TestAddressState).address === 'string'
        ) {
            return {
                address: (parsed as TestAddressState).address,
                enabled: Boolean((parsed as TestAddressState).enabled),
            };
        }
    } catch {
        // Unreadable or blocked storage just means no saved test address.
    }
    return { address: '', enabled: false };
};

export const writeTestAddress = (listingId: string, state: TestAddressState): void => {
    try {
        localStorage.setItem(storageKey(listingId), JSON.stringify(state));
    } catch {
        // Storage can be blocked; the test address then lasts only for this visit.
    }
};

export const isValidTestAddress = (value: string): boolean => {
    try {
        const { protocol } = new URL(value.trim());
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
};

export const displayHost = (value: string): string => {
    try {
        return new URL(value).host;
    } catch {
        return value;
    }
};
