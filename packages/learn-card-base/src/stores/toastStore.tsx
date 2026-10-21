import React, { ReactNode } from 'react';
import { createStore } from '@udecode/zustood';

export enum ToastTypeEnum {
    Success = 'success',
    Error = 'error',
}

export type Toast = {
    message: string | ReactNode;
    options: ResolvedToastOptions;
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

export type ResolvedToastOptions = Required<ToastOptions>;

export const DEFAULT_TOAST_OPTIONS: Readonly<ResolvedToastOptions> = Object.freeze({
    title: '',
    className: '',
    duration: 3000,
    autoDismiss: true,
    type: ToastTypeEnum.Success,
    hasDismissButton: false,
    hasCheckmark: false,
    hasX: false,
    zIndex: 999999,
} satisfies ResolvedToastOptions);

const normalizeToastOptions = (options: ToastOptions = {}): ResolvedToastOptions => {
    const nextOptions: ResolvedToastOptions = { ...DEFAULT_TOAST_OPTIONS, ...options };

    if (nextOptions.hasCheckmark && nextOptions.hasX) {
        if (nextOptions.type === ToastTypeEnum.Error) {
            nextOptions.hasCheckmark = false;
        } else {
            nextOptions.hasX = false;
        }
    }

    return nextOptions;
};

const mergeToastOptions = (
    currentOptions: ResolvedToastOptions,
    options: ToastOptions
): ResolvedToastOptions => {
    const nextOptions: ToastOptions = { ...currentOptions, ...options };

    if (options.hasCheckmark && options.hasX === undefined) nextOptions.hasX = false;
    if (options.hasX && options.hasCheckmark === undefined) nextOptions.hasCheckmark = false;

    return normalizeToastOptions(nextOptions);
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
            // A new toast must not inherit options customized for the previously active toast.
            state.options = normalizeToastOptions(options);
        });
    },

    setOptions: (options: ToastOptions) => {
        set.state(state => {
            state.options = mergeToastOptions(state.options, options);
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
