import { newFlowId } from './sharedContext';

export const SIGNUP_FLOW_ID_KEY = 'lc_signup_flow_id';
export const SIGNUP_STARTED_AT_MS_KEY = 'lc_signup_started_at_ms';
export const LAST_LOGIN_METHOD_KEY = 'lc_last_login_method';

export type StoredSignupFlow = {
    flowId: string;
    startedAtMs: number;
    isNew: boolean;
};

export const getOrCreateSignupFlow = (
    storage: Storage = localStorage,
    createId: () => string = newFlowId,
    now: () => number = Date.now
): StoredSignupFlow => {
    const storedFlowId = storage.getItem(SIGNUP_FLOW_ID_KEY);
    const storedStartedAt = storage.getItem(SIGNUP_STARTED_AT_MS_KEY);
    const parsedStartedAt = storedStartedAt === null ? NaN : Number(storedStartedAt);
    const flowId = storedFlowId ?? createId();
    const startedAtMs = storedFlowId && Number.isFinite(parsedStartedAt) ? parsedStartedAt : now();

    if (!storedFlowId) {
        storage.setItem(SIGNUP_FLOW_ID_KEY, flowId);
    }
    if (!storedFlowId || !Number.isFinite(parsedStartedAt)) {
        storage.setItem(SIGNUP_STARTED_AT_MS_KEY, String(startedAtMs));
    }

    return { flowId, startedAtMs, isNew: !storedFlowId };
};

export const clearSignupFlow = (storage: Storage = localStorage): void => {
    storage.removeItem(SIGNUP_FLOW_ID_KEY);
    storage.removeItem(SIGNUP_STARTED_AT_MS_KEY);
};
