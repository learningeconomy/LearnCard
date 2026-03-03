import { HTMLIonOverlayElement } from '@ionic/core';

export const closeAll = () => {
  // adjust selector to fit your needs
  const overlays = document.querySelectorAll('ion-alert, ion-action-sheet, ion-loading, ion-modal, ion-picker, ion-popover');
  const overlaysArr = Array.from(overlays) as HTMLIonOverlayElement[];
  overlaysArr.forEach(o => o.dismiss());
}