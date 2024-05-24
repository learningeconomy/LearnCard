import { ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';

export const minimalContract: ConsentFlowContract = {
    read: {
        personal: { name: { required: false } },
        credentials: {
            categories: {},
        },
    },
    write: {
        personal: {},
        credentials: {
            categories: {},
        },
    },
};

export const normalContract: ConsentFlowContract = {
    read: {
        personal: { name: { required: false } },
        credentials: {
            categories: {
                Achievement: { required: false },
                ID: { required: false },
            },
        },
    },
    write: {
        personal: { name: { required: false } },
        credentials: {
            categories: {
                Achievement: { required: false },
                ID: { required: false },
            },
        },
    },
};

export const predatoryContract: ConsentFlowContract = {
    read: {
        personal: {
            name: { required: true },
            email: { required: true },
            address: { required: true },
            ssn: { required: true },
            securityQA: { required: true },
            bloodType: { required: true },
            dob: { required: true },
            bankAccounts: { required: true },
        },
        credentials: {
            categories: {
                read: { required: true },
                from: { required: true },
                all: { required: true },
                of: { required: true },
                the: { required: true },
                categories: { required: true },
                lol: { required: true },
            },
        },
    },
    write: {
        personal: {
            name: { required: true },
            email: { required: true },
            address: { required: true },
            ssn: { required: true },
            securityQA: { required: true },
            bloodType: { required: true },
            dob: { required: true },
            bankAccounts: { required: true },
        },
        credentials: {
            categories: {
                write: { required: true },
                to: { required: true },
                all: { required: true },
                of: { required: true },
                the: { required: true },
                categories: { required: true },
                lol: { required: true },
            },
        },
    },
};

export const minimalTerms: ConsentFlowTerms = {
    read: {
        personal: { name: 'Name lol' },
        credentials: { shareAll: false, sharing: false, categories: {} },
    },
    write: {
        personal: {},
        credentials: { categories: {} },
    },
};

export const noTerms: ConsentFlowTerms = {
    read: {
        personal: {},
        credentials: { shareAll: false, sharing: false, categories: {} },
    },
    write: {
        personal: {},
        credentials: { categories: {} },
    },
};

export const normalFullTerms: ConsentFlowTerms = {
    read: {
        personal: { name: 'Full Fullerson' },
        credentials: {
            shareAll: true,
            sharing: true,
            categories: {
                Achievement: {
                    shareAll: true,
                    sharing: true,
                    shared: ['achievement1', 'achievement2'],
                },
                ID: { shareAll: true, sharing: true, shared: ['id1', 'id2'] },
            },
        },
    },
    write: {
        personal: { name: true },
        credentials: { categories: { Achievement: true, ID: true } },
    },
};

export const normalAchievementOnlyTerms: ConsentFlowTerms = {
    read: {
        personal: { name: 'Full Fullerson Only Achievements' },
        credentials: {
            shareAll: false,
            sharing: true,
            categories: {
                Achievement: {
                    shareAll: true,
                    sharing: true,
                    shared: ['achievement1', 'achievement2'],
                },
                ID: {
                    shareAll: false,
                    sharing: false,
                    shared: [],
                },
            },
        },
    },
    write: {
        personal: { name: true },
        credentials: { categories: { Achievement: true, ID: false } },
    },
};

export const normalIDOnlyTerms: ConsentFlowTerms = {
    read: {
        personal: { name: 'Full Fullerson Only IDs' },
        credentials: {
            shareAll: false,
            sharing: true,
            categories: {
                Achievement: {
                    shareAll: false,
                    sharing: false,
                    shared: [],
                },
                ID: { shareAll: true, sharing: true, shared: ['id1', 'id2'] },
            },
        },
    },
    write: {
        personal: { name: true },
        credentials: { categories: { Achievement: false, ID: true } },
    },
};

export const normalNoTerms: ConsentFlowTerms = {
    read: {
        personal: {},
        credentials: {
            shareAll: false,
            sharing: false,
            categories: {
                Achievement: {
                    shareAll: false,
                    sharing: false,
                    shared: [],
                },
                ID: { shareAll: false, sharing: false, shared: [] },
            },
        },
    },
    write: {
        personal: { name: false },
        credentials: { categories: { Achievement: false, ID: false } },
    },
};

export const promiscuousTerms: ConsentFlowTerms = {
    read: {
        personal: {
            name: 'Name lol',
            email: 'name@example.com',
            address: '1234 Example St',
            ssn: '555-55-5555',
            securityQA: "My mother's maiden name is Ejemplo",
            bloodType: 'O+',
            dob: '9/9/99',
            bankAccounts: '12345',
        },
        credentials: { shareAll: true, sharing: true, categories: {} },
    },
    write: {
        personal: {
            name: true,
            email: true,
            address: true,
            ssn: true,
            securityQA: true,
            bloodType: true,
            dob: true,
            bankAccounts: true,
        },
        credentials: {
            categories: {
                write: true,
                to: true,
                all: true,
                of: true,
                the: true,
                categories: true,
                lol: true,
            },
        },
    },
};
