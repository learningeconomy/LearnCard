import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import X from '../../svgs/X';
import Checkmark from '../../svgs/Checkmark';

import { toastStore, ToastTypeEnum } from '../../stores/toastStore';

export const Toast = () => {
    const message = toastStore.use.message();
    const options = toastStore.use.options();

    const dismissToast = toastStore.set.dismissToast;

    useEffect(() => {
        if (!message) return;

        if (!options.autoDismiss) return;

        const timer = setTimeout(() => {
            dismissToast();
        }, options.duration ?? 3000);

        return () => clearTimeout(timer);
    }, [message, options.duration, options.autoDismiss]);

    const isCustomComponent = React.isValidElement(message);

    const toastTextColor =
        options.type === ToastTypeEnum.Error ? 'text-white' : 'text-grayscale-900';
    const toastBackgroundColor =
        options.type === ToastTypeEnum.Error ? 'bg-rose-500' : 'bg-grayscale-50';

    const zIndex = options.zIndex ?? 999999;

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    key="toast"
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                            type: 'spring',
                            stiffness: 480,
                            damping: 28,
                            mass: 0.8,
                        },
                    }}
                    exit={{
                        opacity: 0,
                        y: -20,
                        scale: 0.97,
                        transition: { duration: 0.2, ease: 'easeInOut' },
                    }}
                    style={{ zIndex }}
                    className={`fixed top-4 !left-1/2 !-translate-x-1/2 !w-full !px-4 pointer-events-none safe-area-top-margin`}
                >
                    <div
                        className={`max-w-[600px] mx-auto rounded-[15px] shadow-[0_2px_4px_0_rgba(0,_0,_0,_0.25)] border-2 border-white py-2 px-4 pointer-events-auto relative hover:bg-grayscale-100 ${toastBackgroundColor}`}
                    >
                        {isCustomComponent ? (
                            message
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => toastStore.set.dismissToast()}
                                    className="absolute top-[-10px] left-[-16px] border border-grayscale-200 border-solid p-3 rounded-full h-[35px] w-[35px] flex items-center justify-center bg-grayscale-200 phone:hidden"
                                >
                                    <X className="text-grayscale-900 h-[15px] w-[15px] min-w-[15px] min-h-[15px]" />
                                </button>
                                <div className="flex items-center justify-between min-h-[40px]">
                                    <div className="flex items-center justify-start">
                                        {options.hasCheckmark && (
                                            <div className="flex items-center justify-center rounded-full bg-emerald-700 p-1 mr-4">
                                                <Checkmark className="text-white h-[25px] w-[25px]" />
                                            </div>
                                        )}
                                        {options.hasX && (
                                            <div className="flex items-center justify-center rounded-full bg-red-700 p-1 mr-4">
                                                <X className="text-white h-[25px] w-[25px]" />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            {options.title && (
                                                <h4
                                                    className={`text-sm font-semibold text-left ${toastTextColor}`}
                                                >
                                                    {options.title}
                                                </h4>
                                            )}

                                            <p className={`text-sm text-left ${toastTextColor}`}>
                                                {message}
                                            </p>
                                        </div>
                                    </div>

                                    {options.hasDismissButton && (
                                        <button
                                            type="button"
                                            onClick={dismissToast}
                                            className="border border-grayscale-200 border-solid p-3 rounded-full h-[45px] w-[45px] hidden items-center justify-center bg-white phone:flex"
                                        >
                                            <X className="text-grayscale-900 h-[20px] w-[20px]" />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
