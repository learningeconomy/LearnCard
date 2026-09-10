import { createStore } from '@udecode/zustood';

export type GuardianApprovalData = {
    vp: string;
    childDid: string;
    expiresAt: number;
};

export const guardianApprovalStore = createStore('guardianApprovalStore')<{
    approvalsByParentDid: Record<string, GuardianApprovalData>;
}>({
    approvalsByParentDid: {},
})
    .extendActions((set, get) => ({
        setApproval: (parentDid: string, childDid: string, vp: string, expiresAt: number) => {
            set.approvalsByParentDid({
                ...get.approvalsByParentDid(),
                [parentDid]: { childDid, vp, expiresAt },
            });
        },
        clearApproval: (parentDid: string) => {
            const current = { ...get.approvalsByParentDid() };
            delete current[parentDid];
            set.approvalsByParentDid(current);
        },
        clearAllApprovals: () => {
            set.approvalsByParentDid({});
        },
    }))
    .extendSelectors((state, get) => ({
        getApproval: (parentDid: string, childDid: string): string | undefined => {
            const data = state.approvalsByParentDid[parentDid];
            if (!data || data.childDid !== childDid || Date.now() >= data.expiresAt) {
                return undefined;
            }
            return data.vp;
        },
    }));

export const getGuardianApprovalVP = (childDid: string | undefined): string | undefined => {
    if (!childDid) return undefined;
    const approvals = guardianApprovalStore.get.approvalsByParentDid();
    const now = Date.now();

    for (const [_parentDid, data] of Object.entries(approvals)) {
        if (data.childDid === childDid && data.expiresAt > now) {
            return data.vp;
        }
    }
    return undefined;
};
