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
    autoDismiss?: boolean;
    className?: string;
    hasDismissButton?: boolean;
    hasCheckmark?: boolean;
    hasX?: boolean;
    type?: ToastTypeEnum;
    zIndex?: number;
};

export const toastStore = createStore('toastStore')(
    {
        message: '' as string | ReactNode,
        options: {
            title: '',
            className: '',
            duration: 3000,
            autoDismiss: true,
            type: ToastTypeEnum.Success,
            hasDismissButton: false,
            hasCheckmark: false,
            hasX: false,
            zIndex: 999999,
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

    setOptions: (options: ToastOptions) => {
        set.state(state => {
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
                autoDismiss: true,
                type: ToastTypeEnum.Success,
                hasDismissButton: false,
                hasCheckmark: false,
                hasX: false,
                zIndex: 999999,
            };
        });
    },
}));
export default toastStore;
