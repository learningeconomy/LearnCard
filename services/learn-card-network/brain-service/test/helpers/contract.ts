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