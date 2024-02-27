import { ConsentFlowContract } from "@learncard/types";

export const testContract: ConsentFlowContract = {
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
    }
};