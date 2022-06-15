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
     * @param {boolean=} false - Action button hidden by default.
     */
    showActionButton?: boolean;
    /**
     * action button text
     * @type {boolean}
     * @param {boolean=} "Open Card" - set as default text.
     */
    actionButtonText?: string;
    /**
     *
     * action button click handler
     * @type {function}
     */
    onClick?: () => void;
};
