import { lazyModalContent } from '../generic/lazyModalContent';

// Loads on first render (opened from the dashboard avatar and deep links), not at app start: statically importing this subtree from the
// dashboard and AppRouter put it on the startup path.
const MyLearnCardModal = lazyModalContent(() => import('./MyLearnCardModalContent'));

export default MyLearnCardModal;
