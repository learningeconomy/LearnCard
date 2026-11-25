import { lazyModalContent } from '../../components/generic/lazyModalContent';

// Loads when an app is launched, not at app start: the dashboard's app tiles import this, and its
// subtree (post-message handlers, consent flow, AI chat bot, credential dashboard) was on the startup path.
export const EmbedIframeModal = lazyModalContent(() => import('./EmbedIframeModalContent'));

export default EmbedIframeModal;
