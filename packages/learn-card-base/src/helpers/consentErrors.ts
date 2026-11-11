const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;

/** A sharing conflict is not evidence of an existing consent. */
export const isAlreadyConsentedError = (error: unknown): boolean => {
    const message = asRecord(error)?.message;
    return (
        typeof message === 'string' && message.includes("You've already consented to this contract")
    );
};

export const isConsentConflict = (error: unknown): boolean => {
    const record = asRecord(error);
    const data = asRecord(record?.data);
    const shape = asRecord(record?.shape);
    const shapeData = asRecord(shape?.data);
    return (
        data?.code === 'CONFLICT' ||
        shape?.code === 'CONFLICT' ||
        shapeData?.code === 'CONFLICT' ||
        data?.httpStatus === 409 ||
        shapeData?.httpStatus === 409 ||
        record?.httpStatus === 409 ||
        asRecord(record?.response)?.status === 409
    );
};
