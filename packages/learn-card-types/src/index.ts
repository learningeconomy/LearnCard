export enum VerificationStatus {
    Success = 'Success',
    Failed = 'Failed',
    Error = 'Error',
}

export type VerificationItem = {
    check: string;
    status: VerificationStatus;
    message?: string;
    details?: string;
};
