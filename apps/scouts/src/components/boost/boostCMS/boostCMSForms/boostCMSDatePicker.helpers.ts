import moment from 'moment';

export const commitExpirationDate = (
    value: string | string[] | null | undefined,
    onCommit: (expirationDate: string) => void,
    onClose: () => void
): void => {
    if (typeof value === 'string') {
        onCommit(moment(value).toISOString());
    }

    onClose();
};
