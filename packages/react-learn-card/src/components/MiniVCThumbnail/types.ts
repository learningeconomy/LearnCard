export type MiniVCThumbnailProps = {
    /**
     * thumbnail title
     * @type {string}
     */
    title?: string;
    /**
     * issue date
     * @type {string}
     */
    createdAt?: string;
    /**
     * issuer image
     * @type {string}
     */
    issuerImage?: string;
    /**
     * badge image
     * @type {string}
     */
    badgeImage?: string;
    /**
     * custom className
     * @type {string}
     */
    className?: string;
    /**
     *
     * @type {function}
     */
    onClick?: () => void;
};
