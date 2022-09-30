export type QRCodeCardProps = {
    /**
     * user handle
     * @type {string}
     */
    userHandle?: string;
    /**
     * qr code value
     * @type {string}
     */
    qrCodeValue: string;
    /**
     * text to display on the card
     * @type {React.ReactNode | null}
     */
    text?: string;
    /**
     * custom className
     * @type {string}
     */
    className?: string;
};
