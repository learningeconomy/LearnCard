import { dismissAllAppOverlays } from 'learn-card-base/ui/overlays/overlayStack';

export const closeAll = () => {
    // adjust selector to fit your needs
    const overlays = document.querySelectorAll(
        'ion-alert, ion-action-sheet, ion-loading, ion-modal, ion-picker, ion-popover'
    );
    // Ionic overlay elements (still presented by learn-card-base) expose `dismiss()`.
    const overlaysArr = Array.from(overlays) as (Element & { dismiss?: () => Promise<boolean> })[];
    overlaysArr.forEach(o => void o.dismiss?.());
    dismissAllAppOverlays();
};
