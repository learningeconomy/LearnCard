export type IncrementAppCounterInput = {
    profileId: string;
    listingId: string;
    key: string;
    amount: number;
};

export type IncrementAppCounterResult = {
    previousValue: number;
    newValue: number;
};

export type AppCounterRecord = {
    key: string;
    value: number;
    updatedAt: string | null;
    createdAt: string | null;
};
