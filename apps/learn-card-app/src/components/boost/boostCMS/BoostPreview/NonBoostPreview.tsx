import { lazyModalContent } from '../../../generic/lazyModalContent';

// Loads on first render (opened when a credential is tapped), not at app start: statically importing this subtree from the
// dashboard and AppRouter put it on the startup path.
const NonBoostPreview = lazyModalContent(() => import('./NonBoostPreviewContent'));

export default NonBoostPreview;
