import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { IonRow, IonCol, useIonModal } from '@ionic/react';
import Eyedropper from 'learn-card-base/svgs/Eyedropper';
import X from 'learn-card-base/svgs/X';

import { BoostCMSState } from '../../../boost';

const BoostIDCardAccentForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const handleStateChange = (propName: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState.appearance,
                    [propName]: value,
                },
            };
        });
    };

    const handleColorChange = (hex: string) => handleStateChange('accentColor', hex);

    const handleColorInputOnChange = (value: string) => {
        let updatedValue;

        if (value !== '') updatedValue = value.startsWith('#') ? value : `#${value}`;

        handleStateChange('accentColor', updatedValue);

        return;
    };

    const [presentColorPicker, dismissColorPicker] = useIonModal(
        <div className="flex flex-col items-center justify-center w-full h-full transparent">
            <div className="flex items-center justify-center mb-2">
                <button
                    onClick={() => dismissColorPicker()}
                    className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                >
                    <X className="text-black w-[30px]" />
                </button>
            </div>
            <HexColorPicker
                color={state?.appearance?.accentColor ? state?.appearance?.accentColor : '#4F46E5'}
                onChange={handleColorChange}
            />
        </div>
    );

    return (
        <>
            <IonCol size="12" className="w-full bg-white flex items-center justify-between mt-4">
                <h3 className="text-grayscale-700 text-left w-full font-medium text-lg">
                    Accent Color
                </h3>
            </IonCol>

            <div className="w-full flex items-center justify-center p-0 m-0 mt-2">
                <div className="relative w-full flex items-center justify-between">
                    <input
                        value={state?.appearance?.accentColor}
                        onChange={e => handleColorInputOnChange(e.target.value)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base w-full pr-10"
                        placeholder="Color Hex Code"
                        type="text"
                        disabled={disabled}
                    />

                    {/* <Eyedropper className="absolute w-[30px] h-[30px] right-2 text-grayscale-900" /> */}
                </div>

                <button
                    onClick={() => {
                        presentColorPicker({
                            backdropDismiss: true,
                            showBackdrop: false,
                        });
                    }}
                    className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-[10px] ml-2"
                    style={{
                        backgroundColor: state?.appearance?.accentColor
                            ? state?.appearance?.accentColor
                            : '#4F46E5',
                    }}
                    disabled={disabled}
                />
            </div>
        </>
    );
};

export default BoostIDCardAccentForm;
