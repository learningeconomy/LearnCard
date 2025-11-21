import Checkmark from 'learn-card-base/svgs/Checkmark';
import X from 'learn-card-base/svgs/X';
import React, { useState, useEffect } from 'react';
import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';
import { Capacitor } from '@capacitor/core';

interface CustomToastProps {
    title?: string;
    message: string;
    onDismiss: () => void;
    duration?: number;
    className?: string;
    hasDismissButton?: boolean;
    version?: number;
    toastType?: ToastTypeEnum;
}

export enum ToastTypeEnum {
    CopySuccess = 'custom-user-did-success-copy-toast',
    CopyFail = 'custom-user-did-copy-fail-toast',

    Success = 'success',
    Error = 'error',
}

const CustomToast: React.FC<CustomToastProps> = ({
    title,
    message,
    onDismiss,
    duration = 3000,
    className = '',
    hasDismissButton,
    version = 1,
    toastType,
}) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    const safeArea = useSafeArea();
    let topPosition = safeArea.top;
    if (Capacitor.isNativePlatform()) topPosition = 20 + safeArea.top;

    if (version === 2) {
        return (
            <div
                className={`w-full z-50 fixed top-4 left-1/2 transform -translate-x-1/2 safe-area-top-margin flex items-center justify-center ${className}`}
                style={{
                    top: `${topPosition}px`,
                }}
            >
                <div className="max-w-[90%] w-full flex items-center justify-start p-4 rounded-[14px] bg-white shadow-[0_3px_5px_-1px_rgba(0,_0,_0,_0.2),_0_6px_10px_0_rgba(0,_0,_0,_0.14),_0_1px_18px_0_rgba(0,_0,_0,_0.12)] relative">
                    {toastType === ToastTypeEnum.Success && (
                        <div className="flex items-center justify-center rounded-full bg-emerald-700 p-1 mr-4">
                            <Checkmark className="text-white h-[25px] w-[25px]" />
                        </div>
                    )}
                    {toastType === ToastTypeEnum.Error && (
                        <div className="flex items-center justify-center rounded-full bg-red-700 p-1 mr-4">
                            <X className="text-white h-[25px] w-[25px]" />
                        </div>
                    )}
                    <div>
                        <p className="text-[14px] font-poppins font-semibold text-grayscale-900 line-clamp-1 capitalize">
                            {title}
                        </p>
                        <p className="text-[14px] font-poppins text-grayscale-900 line-clamp-2">
                            {message}
                        </p>
                    </div>
                    {hasDismissButton && (
                        <button
                            className="rounded-full w-[35px] h-[35px] bg-white uppercase absolute top-[-5px] right-[-5px] z-50 shadow-[0_3px_5px_-1px_rgba(0,_0,_0,_0.2),_0_6px_10px_0_rgba(0,_0,_0,_0.14),_0_1px_18px_0_rgba(0,_0,_0,_0.12)] flex items-center justify-center"
                            onClick={onDismiss}
                        >
                            <X className="w-[25px] h-auto text-grayscale-500" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
            /* Shadows */
            shadow-[0_3px_5px_-1px_rgba(0,_0,_0,_0.2),_0_6px_10px_0_rgba(0,_0,_0,_0.14),_0_1px_18px_0_rgba(0,_0,_0,_0.12)] 
          
            /* Typography */
            text-sm
            font-poppins
          
            /* Layout */
            w-full
            max-w-[700px]
            fixed
            top-4
            left-1/2
            transform
            -translate-x-1/2
            p-4
            rounded-[14px]
            z-50
            flex
            justify-between
            items-center
            space-x-3
          
            /* Colors */
            ${
                toastType === ToastTypeEnum.Success
                    ? 'bg-[#eff0f5] text-black'
                    : 'bg-red-700 text-white'
            }
          
            /* Optional Custom Class */
            ${className}
          `}
            style={{
                top: `${topPosition}px`,
            }}
        >
            {message}
            {hasDismissButton && (
                <button className="uppercase" onClick={onDismiss}>
                    Dismiss
                </button>
            )}
        </div>
    );
};

import { createContext, useContext, ReactNode } from 'react';

interface ToastContextType {
    presentToast: (
        message: string,
        options?: {
            title?: string;
            duration?: number;
            className?: string;
            hasDismissButton?: boolean;
            toastType?: ToastTypeEnum;
            version?: number;
        }
    ) => void;
    ToastComponent: JSX.Element | null;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children?: ReactNode }) => {
    const [toast, setToast] = useState<{
        message: string;
        title?: string;
        duration?: number;
        className?: string;
        hasDismissButton?: boolean;
        version?: number;
        toastType?: ToastTypeEnum;
    } | null>(null);

    const presentToast = (
        message: string,
        options?: {
            title?: string;
            duration?: number;
            className?: string;
            hasDismissButton?: boolean;
            toastType?: ToastTypeEnum;
            version?: number;
        }
    ) => {
        let {
            title,
            duration = 3000,
            className = '',
            hasDismissButton,
            toastType,
            version,
        } = options ?? {};
        if (toastType) className = `${className} ${toastType}`;
        setToast({ message, title, duration, className, hasDismissButton, version, toastType });
    };

    const ToastComponent = toast ? (
        <CustomToast
            message={toast?.message}
            title={toast?.title}
            onDismiss={() => setToast(null)}
            duration={toast?.duration}
            className={toast?.className}
            hasDismissButton={toast?.hasDismissButton}
            version={toast?.version}
            toastType={toast?.toastType}
        />
    ) : null;

    return (
        <ToastContext.Provider value={{ presentToast, ToastComponent }}>
            {children}
            {ToastComponent}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
