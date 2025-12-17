import React, { ReactNode } from 'react';
import { createStore } from '@udecode/zustood';

export enum ToastTypeEnum {
    Success = 'success',
    Error = 'error',
}

export type Toast = {
    message: string | ReactNode;
    options: ToastOptions;
};

export type ToastOptions = {
    title?: string;
    duration?: number;
    className?: string;
    hasDismissButton?: boolean;
    hasCheckmark?: boolean;
    hasX?: boolean;
    type?: ToastTypeEnum;
};

export const toastStore = createStore('toastStore')(
    {
        message: '' as string | ReactNode,
        options: {
            title: '',
            className: '',
            duration: 3000,
            type: ToastTypeEnum.Success,
            hasDismissButton: false,
            hasCheckmark: false,
            hasX: false,
        },
    },
    { persist: { name: 'toastStore', enabled: false } }
).extendActions(set => ({
    presentToast: (message: string | ReactNode, options?: ToastOptions) => {
        set.state(state => {
            state.message = message;

            state.options = {
                ...state.options,
                ...options,
            };
        });
    },

    dismissToast: () => {
        set.state(state => {
            state.message = '';
            state.options = {
                title: '',
                className: '',
                duration: 3000,
                type: ToastTypeEnum.Success,
                hasDismissButton: false,
                hasCheckmark: false,
                hasX: false,
            };
        });
    },
}));
export default toastStore;
