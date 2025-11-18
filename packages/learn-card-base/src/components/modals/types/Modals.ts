import { FC, ReactNode } from 'react';
import type { SuggestString } from '@learncard/types';

export const enum ModalTypes {
    None = '',
    Center = 'center',
    Cancel = 'cancel',
    Freeform = 'free-form',
    FullScreen = 'full-screen',
    Select = 'select',
    Right = 'right',
}

/** Valid Modal Types */
export type ModalType = {
    desktop: ModalTypes;
    mobile: ModalTypes;
};

export type ModalOptions = {
    /**
     * CSS class passed to the modal itself
     *
     * Some common classes are:
     * low-z: Lowers the z-height to 1, allowing other elements to appear above the modal
     * no-top-padding: Removes the top padding on the mobile menu modal
     * white-notch: Changes the notch color at the top of the mobile menu modal to white
     */
    className?: SuggestString<'no-min-height'>;

    /** Adds an additional custom class to the fullscreen modal <section></section> element */
    sectionClassName?: string;

    /** Adds an additional class for the top section in Cancel Modal */
    topSectionClassName?: string;

    /** Adds an additional class specifically for android styling in Cancel Modal */
    androidClassName?: string;

    /** Hides the button that appears in the top right of the Center Modal */
    hideButton?: boolean;

    /** Generic close-button that can overflow outside the modal container */
    customCloseButton?: boolean;

    /** className exlusive to the customCloseButton */
    customCloseButtonClass?: string;

    /** Shows a close button the mobile select modal */
    showCloseButtonOnMobile?: boolean;
    /** className exlusive to the mobile close button */
    mobileCloseButtonClass?: string;

    // hides the notch on mobile
    showNotch?: boolean;

    /** overrides the cancel button text */
    cancelButtonTextOverride?: String;

    /**
     * Callback function that is called when closing the modal by "natively"
     *
     * In other words, this function is called when the user clicks the X button, or clicks on
     * the dimmer to close the modal
     */
    onClose?: () => void;

    /**
     * Confirmation prompt to display before closing modal natively"
     *
     * In other words, this string will be displayed as a confirmation prompt before closing the
     * modal when clicking the X button or clicking the dimmer to close the modal
     */
    confirmClose?: string;

    /**
     * Optional class to pass on to the confirmation dialog
     */
    confirmationClassName?: string;

    /**
     * If set to true, modals will have their max-width raised on desktop.
     *
     * This is useful when displaying a modal on top of an existing modal
     */
    widen?: boolean;

    /**
     * If set to true, modals will have a larger box-shadow
     *
     * This is useful when displaying a modal on top of an existing modal
     */
    addShadow?: boolean;

    /**
     * If set to true, there will be no lightboxing/dimmer button
     *
     * This is useful when displaying a modal on top of an existing modal
     */
    hideDimmer?: boolean;

    /**
     * This object determines the foreground and background colors of the LeftModal's
     * close button. The values are converted into CSS variables that are used by the
     * color property of the appropriate elements.
     *
     * This can be very useful if you'd like to change the whole background color of the LeftModal
     */
    buttonColors?: { foreground?: string; background?: string };

    /**
     * Disables the automatic close handlers that allows users to close the modal by clicking the X
     * button or the dimmer.
     *
     * BE VERY CAREFUL USING THIS OPTION, AS IT COULD LEAD TO A BROKEN STATE WHERE USERS CANNOT
     * ESCAPE!!!
     *
     * YOU HAVE BEEN WARNED!
     */
    disableCloseHandlers?: boolean;

    // background image for the modal
    //   CURRENTLY ONLY IMPLEMENTED FOR FULLSCREEN MODALS
    backgroundImage?: string;

    //Determines whether to use createPortal to render content inside the Cancel modal
    usePortal?: boolean;

    //Adds ability to style the portal as needed
    portalClassName?: string;
};

export type ModalComponent = ReactNode;

export type Modal = {
    component: ModalComponent;
    type: ModalType;
    options?: ModalOptions;
    open: boolean;
    id: number;
};

export type ModalProps = {
    component: ModalComponent;
    options?: ModalOptions;
    open: boolean;
};

export type ModalContainer = FC<ModalProps>;
