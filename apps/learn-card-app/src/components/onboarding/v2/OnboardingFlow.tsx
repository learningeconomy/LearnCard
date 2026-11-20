import { lazyModalContent } from '../../generic/lazyModalContent';

// Loads on first render (shown only to accounts that have not finished onboarding), not at app start: statically importing this subtree from the
// dashboard and AppRouter put it on the startup path.
const OnboardingFlow = lazyModalContent(() => import('./OnboardingFlowContent'));

export default OnboardingFlow;
