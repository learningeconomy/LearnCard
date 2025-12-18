import React, { useEffect, useState } from 'react';

import X from '../../svgs/X';
import { IonFooter } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import keyboardStore from 'learn-card-base/stores/keyboardStore';
import { useModal } from 'learn-card-base';
import { useRef } from 'react';

export const AiAssessmentFooter: React.FC = () => {
    const { closeModal } = useModal();
    const bottomBarRef = useRef<HTMLIonFooterElement>(null);

    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [showFooter, setShowFooter] = useState(true);

    useEffect(() => {
        const unsubscribe = keyboardStore.store.subscribe(({ isOpen }) => {
            if (Capacitor.isNativePlatform()) {
                setIsKeyboardOpen(isOpen);

                if (isOpen) {
                    setTimeout(() => setShowFooter(false), 300);
                } else {
                    setShowFooter(true);
                }
            }
        });

        return unsubscribe;
    }, []);

    const getFooterClasses = () => {
        const baseClasses =
            'w-full bg-white flex items-center justify-center ion-padding border-t-[1px] border-grayscale-100 transition-all duration-300 ease-in-out overflow-hidden';

        return isKeyboardOpen
            ? `${baseClasses} transform translate-y-full opacity-0`
            : `${baseClasses} transform translate-y-0 opacity-100`;
    };

    if (!showFooter) return <></>;

    return (
        <IonFooter ref={bottomBarRef} className={getFooterClasses()}>
            <button onClick={closeModal} className="rounded-full bg-white shadow-3xl p-4">
                <X className="text-grayscale-800 w-[20px] h-auto" strokeWidth="5" />
            </button>
        </IonFooter>
    );
};

export default AiAssessmentFooter;
