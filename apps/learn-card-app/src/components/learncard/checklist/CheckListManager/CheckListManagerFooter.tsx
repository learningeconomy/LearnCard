import React from 'react';
import { Capacitor } from '@capacitor/core';

import { IonFooter } from '@ionic/react';

import { useModal } from 'learn-card-base';
import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';

import useTheme from '../../../../theme/hooks/useTheme';

const CheckListManagerFooter: React.FC<{ handleSave?: () => void; loading?: boolean }> = ({
    handleSave,
    loading,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { closeModal } = useModal();
    const safeArea = useSafeArea();

    let bottomPosition = safeArea.bottom;
    if (Capacitor.isNativePlatform()) bottomPosition = 20 + safeArea.bottom;

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 left-0 bg-white !max-h-[100px]"
            style={{
                bottom: `${bottomPosition}px`,
            }}
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    <button
                        onClick={closeModal}
                        className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                    >
                        Back
                    </button>
                    {handleSave && (
                        <button
                            disabled={loading}
                            onClick={() => {
                                if (handleSave) {
                                    handleSave?.();
                                    return;
                                }

                                closeModal();
                                return;
                            }}
                            className={`py-[9px] pl-[20px] pr-[15px] bg-${primaryColor} rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center mr-2`}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>
        </IonFooter>
    );
};

export default CheckListManagerFooter;
