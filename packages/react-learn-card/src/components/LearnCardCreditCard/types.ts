export type LearnCardCreditCardFrontFaceProps = {
    /**
     * user image
     * @type {string}
     */
    userImage?: string;
    /**
     * qr code value
     * @type {string}
     */
    qrCodeValue?: string;
    /**
     * custom className
     * @type {string}
     */
    className?: string;
    /**
     * show or hide an action button
     * @type {boolean}
     */
    showActionButton?: false;
    /**
     * action button text
     * @type {boolean}
     */
    ActionButtonText?: false;
    /**
     *
     * action button click handler
     * @type {function}
     */
    onClick?: () => void;
};
