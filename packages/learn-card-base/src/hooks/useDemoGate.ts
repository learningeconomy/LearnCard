import { demoGateStore } from '../stores/demoGateStore';
import { demoSessionStore } from '../stores/demoSessionStore';

/**
 * Point-of-use gate for real (write) actions while Sample Wallet mode is
 * active — mirrors the useAiFeatureGate pattern.
 *
 * `guardDemoAction()` returns true when the action may proceed. In demo mode
 * it opens the Sample Wallet gate sheet and returns false, so call sites can
 * simply early-return:
 *
 * ```ts
 * const { guardDemoAction } = useDemoGate();
 * const handleShare = () => {
 *     if (!guardDemoAction('Share credential')) return;
 *     reallyShare();
 * };
 * ```
 */
export const useDemoGate = () => {
    const activePersonaId = demoSessionStore.use.activePersonaId();
    const isDemo = Boolean(activePersonaId);

    const guardDemoAction = (actionLabel?: string): boolean => {
        if (!isDemo) return true;

        demoGateStore.set.openGate(actionLabel);
        return false;
    };

    return { isDemo, guardDemoAction };
};

export default useDemoGate;
