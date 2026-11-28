// Page shell under test. PageShellVisualFixture's synthetic cases import from here so the same
// fixture renders Ionic (before) or the app-owned components (after).
export { AppPage as Page, AppContent as Content } from 'learn-card-base/ui/chrome';
/** The call-site spelling of "justify the scroll area's children to the end". */
export const SCROLL_JUSTIFY_END = '[&>.app-content-scroll]:justify-end';
