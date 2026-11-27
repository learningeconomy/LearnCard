/** Ionic's printIonWarning / printIonError, with this component's name. */
export const printWarning = (message: string, ...params: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.warn(`[AppDatetime]: ${message}`, ...params);
};

export const printError = (message: string, ...params: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error(`[AppDatetime]: ${message}`, ...params);
};
