// Own module so theme validators and defaults can use the ids without importing the nav bar
// component (and through it the icon sets, error boundary and feedback UI) into the entry.
export enum MobileNavBarLinks {
    dashboard = 'dashboard',
    wallet = 'wallet',
    plus = '/boost',
    launchpad = 'launchpad',
    notification = 'notification',
}
