import React from 'react';

export type AppPageProps = React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonPage`: the routed page's box, the same `div.ion-page` IonPage
 * rendered. `.ion-page` fills the outlet / modal / tab box as a flex column (AppHeader, then
 * AppContent filling the rest, then AppFooter); learn-card-base and the app shell also look the
 * page up by that class. Outside IonRouterOutlet IonPage had no other behavior, and this app no
 * longer has one (AppOutlet's `useViewWillEnter` replaced the lifecycle hooks).
 */
export const AppPage: React.FC<AppPageProps> = ({ className, ref, ...rest }) => (
    <div {...rest} ref={ref} className={className ? `${className} ion-page` : 'ion-page'} />
);

export default AppPage;
