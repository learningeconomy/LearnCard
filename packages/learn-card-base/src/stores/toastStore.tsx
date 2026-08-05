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

export const DEFAULT_TOAST_OPTIONS: ToastOptions = {
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

const normalizeToastOptions = (options: ToastOptions = {}): ToastOptions => {
    const nextOptions = { ...DEFAULT_TOAST_OPTIONS, ...options };

    if (nextOptions.hasCheckmark && nextOptions.hasX) {
        if (nextOptions.type === ToastTypeEnum.Error) {
            nextOptions.hasCheckmark = false;
        } else {
            nextOptions.hasX = false;
        }
    }

    return nextOptions;
};

export const toastStore = createStore('toastStore')(
    {
        message: '' as string | ReactNode,
        options: { ...DEFAULT_TOAST_OPTIONS },
    },
    { persist: { name: 'toastStore', enabled: false } }
).extendActions(set => ({
    presentToast: (message: string | ReactNode, options?: ToastOptions) => {
        set.state(state => {
            state.message = message;
            state.options = normalizeToastOptions(options);
        });
    },

    setOptions: (options: ToastOptions) => {
        set.state(state => {
            state.options = normalizeToastOptions({ ...state.options, ...options });
        });
    },

    dismissToast: () => {
        set.state(state => {
            state.message = '';
            state.options = { ...DEFAULT_TOAST_OPTIONS };
        });
    },
}));
export default toastStore;
