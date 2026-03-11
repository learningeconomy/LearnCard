import { createStore } from '@udecode/zustood';

export type GuardianApprovalData = {
    vp: string;
    expiresAt: number;
};

export const guardianApprovalStore = createStore('guardianApprovalStore')<{
    approvalsByParentDid: Record<string, GuardianApprovalData>;
}>({
    approvalsByParentDid: {},
})
    .extendActions((set, get) => ({
        setApproval: (parentDid: string, vp: string, expiresAt: number) => {
            set.approvalsByParentDid({
                ...get.approvalsByParentDid(),
                [parentDid]: { vp, expiresAt },
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
        getApproval: (parentDid: string): string | undefined => {
            const data = state.approvalsByParentDid[parentDid];
            if (!data) return undefined;
            if (Date.now() > data.expiresAt) {
                return undefined;
            }
            return data.vp;
        },
    }));

export const getGuardianApprovalVP = (): string | undefined => {
    const approvals = guardianApprovalStore.get.approvalsByParentDid();
    const now = Date.now();

    console.log(
        '[guardianApprovalStore] getGuardianApprovalVP called, approvals:',
        Object.keys(approvals)
    );

    for (const [parentDid, data] of Object.entries(approvals)) {
        if (data.expiresAt > now) {
            console.log('[guardianApprovalStore] Found valid VP for parentDid:', parentDid);
            return data.vp;
        } else {
            console.log('[guardianApprovalStore] VP expired for parentDid:', parentDid);
        }
    }
    console.log('[guardianApprovalStore] No valid VP found');
    return undefined;
};
