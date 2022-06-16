export type LearnCardCreditCardBackFaceProps = {
    /**
     * custom className
     * @type {string}
     */
    className?: string;
    user: LearnCardCreditCardUserProps;
    card: LearnCardCreditCardProps;
};

export type LearnCardCreditCardUserProps = {
    /**
     * unique user handle / username
     * @type {string}
     */
    username?: string;
    /**
     * user full name
     * @type {string}
     */
    fullName: string;
};

export type LearnCardCreditCardProps = {
    /**
     * card number
     * @type {number}
     */
    cardNumber: string;
    /**
     * card issue date
     * @type {string}
     */
    cardIssueDate?: string;
    /**
     * card expiration date
     * @type {string}
     */
    cardExpirationDate: string;
    /**
     * card security code
     * @type {string}
     */
    cardSecurityCode?: string;
};
