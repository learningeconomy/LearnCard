/**
 * Shared auth coordinator UI components.
 *
 * These are generic overlays that any app can use with the coordinator.
 * App-specific modals (e.g. RecoveryFlowModal, RecoverySetupModal)
 * remain in each app's own component tree.
 */

export { Overlay } from './Overlay';
export { ErrorOverlay } from './ErrorOverlay';
export { StalledMigrationOverlay } from './StalledMigrationOverlay';
