import React from 'react';
import { HexColorPicker } from 'react-colorful';

import { IonCol } from '@ionic/react';
import X from 'learn-card-base/svgs/X';

import { BoostCMSState } from '../../../boost';
import { ModalTypes, useModal } from 'learn-card-base';

const BoostIDCardFontForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const { newModal, closeModal } = useModal();
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

    const handleColorChange = (hex: string) => handleStateChange('fontColor', hex);

    const handleColorInputOnChange = (value: string) => {
        let updatedValue;

        if (value !== '') updatedValue = value.startsWith('#') ? value : `#${value}`;

        handleStateChange('fontColor', updatedValue);

        return;
    };

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
                    color={state?.appearance?.fontColor ? state?.appearance?.fontColor : '#4F46E5'}
                    onChange={handleColorChange}
                />
            </div>,
            { className: '!bg-transparent !shadow-none' },
            { mobile: ModalTypes.Center, desktop: ModalTypes.Center }
        );
    };

    return (
        <>
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h3 className="text-grayscale-700 text-left w-full font-medium text-lg">
                    Font Color
                </h3>
            </IonCol>

            <div className="w-full flex items-center justify-center p-0 m-0 mt-2">
                <div className="relative w-full flex items-center justify-between">
                    <input
                        value={state?.appearance?.fontColor}
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
                    className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-[10px] ml-2 shadow-3xl"
                    style={{
                        backgroundColor: state?.appearance?.fontColor
                            ? state?.appearance?.fontColor
                            : '#ffffff',
                    }}
                    disabled={disabled}
                />
            </div>
        </>
    );
};

export default BoostIDCardFontForm;
