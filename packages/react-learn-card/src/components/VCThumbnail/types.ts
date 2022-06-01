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
     * custom className
     * @type {string}
     */
    className?: string;
    /**
     * condensed or full view
     * of the thumbnail - defaulted to false
     * @type {boolean}
     */
    listView?: boolean;
    /**
     *
     * @type {function}
     */
    onClick?: () => void;
};