import React from 'react';

export type SchoolIDCardProps = {
    /**
     * student image
     * @type {string}
     */
    userImage?: string;
    /**
     * student name
     * @type {string}
     */
    userName: string;
    /**
     * text to display below the student name
     * @type {React.ReactNode | string | undefined}
     */
    text?: React.ReactNode | string | undefined;
    /**
     * extra text to display on the ID card
     * @type {React.ReactNode | string | undefined}
     */
    extraText?: string;
    /**
     * fixed ID background
     * @type {string}
     */
    backgroundImage: string;
    /**
     * custom className
     * @type {string}
     */
    className?: string;
    /**
     * custom container className
     * @type {string}
     */
    containerClassName?: string;
    showBarcode?: boolean;
    subjectInitials?: string;
    subjectInitialsClass?: string;
};
