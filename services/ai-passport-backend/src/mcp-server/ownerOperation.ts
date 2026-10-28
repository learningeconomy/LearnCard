import { runWithAiPrivacyContext } from '../ai/privacy';
import { withOwnerOperation } from '../services/dataErasure';

export const runMcpOwnerOperation = async <T>(did: string, operation: () => Promise<T>) => {
    return withOwnerOperation(did, () => runWithAiPrivacyContext(did, operation));
};
