import React from 'react';
import { HexColorPicker } from 'react-colorful';

import { IonCol } from '@ionic/react';
import X from 'learn-card-base/svgs/X';

import { BoostCMSState } from '../../../boost';
import { useModal, ModalTypes } from 'learn-card-base';

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

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const presentColorPicker = () => {
        newModal(
            <div className="flex flex-col items-center justify-center w-full h-full transparent">
                <div className="flex items-center justify-center mb-2">
                    <button
                        onClick={() => closeModal()}
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
    };

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
                </div>

                <button
                    onClick={() => {
                        presentColorPicker();
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
