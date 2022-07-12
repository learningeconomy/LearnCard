export type VCThumbnailProps = {
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
     * user image
     * @type {string}
     */
    userImage?: string;
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
     * condensed or full view of the thumbnail
     * @type {boolean}
     * @param {boolean=} false - shows full view by default.
     */
    listView?: boolean;
    /**
     *
     * @type {function}
     */
    onClick?: () => void;
};
