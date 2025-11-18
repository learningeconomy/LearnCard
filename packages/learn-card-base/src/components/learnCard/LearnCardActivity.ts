export enum ActivityTransactionStatusEnum {
    approved = 'approved',
    pending = 'pending',
    cancelled = 'cancelled',
    failed = 'failed',
}

export type LearnCardActivityTransaction = {
    issuerImage: string;
    issuerName: string;
    issueDate: string;
    status: ActivityTransactionStatusEnum;
    amount: number;
};

export const MOCK_ACTIVITIES: LearnCardActivityTransaction[] = [
    {
        issuerImage:
            'https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Jack_Daniels_Logo.svg/1200px-Jack_Daniels_Logo.svg.png',
        issuerName: "Jack Daniel's",
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.approved,
        amount: 133.63,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/1gWX5l8fQzC5Yblnnbju',
        issuerName: 'Vender Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 100.0,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/IJaCl132Q8aiD8XKQSwI',
        issuerName: 'User Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 6.25,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/1gWX5l8fQzC5Yblnnbju',
        issuerName: 'Vender name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.approved,
        amount: 49.55,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/IJaCl132Q8aiD8XKQSwI',
        issuerName: 'User Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 6.25,
    },
    {
        issuerImage:
            'https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Jack_Daniels_Logo.svg/1200px-Jack_Daniels_Logo.svg.png',
        issuerName: "Jack Daniel's",
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.approved,
        amount: 133.63,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/1gWX5l8fQzC5Yblnnbju',
        issuerName: 'Vender Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 100.0,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/IJaCl132Q8aiD8XKQSwI',
        issuerName: 'User Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 6.25,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/1gWX5l8fQzC5Yblnnbju',
        issuerName: 'Vender name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.approved,
        amount: 49.55,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/IJaCl132Q8aiD8XKQSwI',
        issuerName: 'User Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 6.25,
    },
    {
        issuerImage:
            'https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Jack_Daniels_Logo.svg/1200px-Jack_Daniels_Logo.svg.png',
        issuerName: "Jack Daniel's",
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.approved,
        amount: 133.63,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/1gWX5l8fQzC5Yblnnbju',
        issuerName: 'Vender Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 100.0,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/IJaCl132Q8aiD8XKQSwI',
        issuerName: 'User Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 6.25,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/1gWX5l8fQzC5Yblnnbju',
        issuerName: 'Vender name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.approved,
        amount: 49.55,
    },
    {
        issuerImage: 'https://cdn.filestackcontent.com/IJaCl132Q8aiD8XKQSwI',
        issuerName: 'User Name',
        issueDate: '04 Apr 22',
        status: ActivityTransactionStatusEnum.pending,
        amount: 6.25,
    },
];
