import { lazyModalContent } from '../generic/lazyModalContent';

// Loads on first render (opened from a shared-boost link), not at app start: statically importing this subtree from the
// dashboard and AppRouter put it on the startup path.
const ViewSharedBoost = lazyModalContent(() => import('./ViewSharedBoostContent'));

export default ViewSharedBoost;
