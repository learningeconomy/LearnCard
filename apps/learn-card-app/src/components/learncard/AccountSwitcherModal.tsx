import { lazyModalContent } from '../generic/lazyModalContent';

// Loads on first render (opened from the account menu), not at app start: statically importing this subtree from the
// dashboard and AppRouter put it on the startup path.
const AccountSwitcherModal = lazyModalContent(() => import('./AccountSwitcherModalContent'));

export default AccountSwitcherModal;
