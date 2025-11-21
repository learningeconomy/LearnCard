import React, { useEffect, useState } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

import { IonRow } from '@ionic/react';
import ModalLayout from '../../layout/ModalLayout';
import AppIcon from '../../assets/images/app-icon.png';

export const CapGoUpdateModal: React.FC<{
    closeModal: () => void;
    updateVersion: string;
    bundle: any;
}> = ({ closeModal, updateVersion, bundle }) => {
    const [currentVersion, setCurrentVersion] = useState<string>('');

    useEffect(() => {
        getCurrentVersion();
    }, []);

    const getCurrentVersion = async () => {
        // Note the below call returns 'builtin' if none are set
        const currentBundle = (await CapacitorUpdater.current()).bundle;
        setCurrentVersion(currentBundle.version);
    };

    const handleManualUpdate = () => {
        try {
            if (bundle) {
                CapacitorUpdater.set(bundle);
            }
        } catch (error) {
            closeModal();
            console.log(error);
        }
    };

    return (
        <IonRow className="flex flex-col pb-4 w-full bg-white">
            <div className="w-full flex flex-col items-center justify-center pt-2">
                <img
                    src={AppIcon}
                    alt="app iocon"
                    className="h-[75px] w-[75px] overflow-hidden rounded-[12px] mt-4"
                />
                <h6 className="tracking-[16px] text-[20px] font-bold text-black mt-4">SCOUTPASS</h6>
                {currentVersion?.toString?.() !== 'builtin' &&
                    currentVersion?.toString?.() !== '' && (
                        <p className="text-[17px] text-grayscale-900 mt-2 font-medium">
                            Current Version: {currentVersion}
                        </p>
                    )}

                <button
                    onClick={handleManualUpdate}
                    className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700  text-2xl w-full shadow-lg max-w-[320px] mt-4"
                >
                    Update to {updateVersion}
                </button>
            </div>
        </IonRow>
    );
};

export default CapGoUpdateModal;
