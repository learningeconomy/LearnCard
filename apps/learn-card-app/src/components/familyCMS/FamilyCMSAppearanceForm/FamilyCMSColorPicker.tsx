import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import Eyedropper from 'learn-card-base/svgs/Eyedropper';
import X from 'learn-card-base/svgs/X';

import { FamilyCMSState } from '../familyCMSState';
import { ModalTypes, useModal } from 'learn-card-base';

const FamilyColorPickerWrapper: React.FC<{
    closeModal: () => void;
    color: string;
    handleColorChange: (color: string) => void;
}> = ({ closeModal, color, handleColorChange }) => {
    return (
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
                color={color ? color : '#353E64'}
                onChange={e => handleColorChange(e)}
            />
        </div>
    );
};

export const FamilyCMSColorPicker: React.FC<{
    title: string;
    _color: string | undefined;
    updateFieldKey: string;
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
}> = ({ title, _color, updateFieldKey, state, setState }) => {
    const [color, setColor] = useState<string>(_color ?? '#353E64');
    const { newModal, closeModal } = useModal();

    const handleStateChange = (key: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState?.appearance,
                    [key]: value,
                },
            };
        });
    };

    const handleColorChange = (hex: string) => {
        setColor(hex);
        handleStateChange(updateFieldKey, hex);
    };

    const presentColorPicker = () => {
        newModal(
            <FamilyColorPickerWrapper
                closeModal={closeModal}
                color={color}
                handleColorChange={handleColorChange}
            />,
            { className: '!bg-transparent !shadow-none' },
            { mobile: ModalTypes.Center, desktop: ModalTypes.Center }
        );
    };

    const handleColorInputOnChange = (value: string) => {
        let updatedValue;

        if (value !== '') updatedValue = value.startsWith('#') ? value : `#${value}`;

        handleStateChange(updateFieldKey, updatedValue);
        setColor(updatedValue);

        return;
    };

    return (
        <div className="flex flex-col bg-white rounded-[15px] w-full mb-[20px]">
            <h3 className="text-grayscale-900 font-poppins font-normal text-left w-full text-[20px]">
                {title}
            </h3>

            <div className="w-full flex items-center justify-between p-0 m-0 mt-4">
                <button
                    onClick={() => {
                        presentColorPicker({
                            backdropDismiss: true,
                            showBackdrop: false,
                        });
                    }}
                    className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-[10px] mr-2 shadow-soft-bottom"
                    style={{
                        backgroundColor: color ? color : '#353E64',
                    }}
                />
                <div className="relative w-full flex items-center justify-between">
                    <input
                        value={color}
                        onChange={e => handleColorInputOnChange(e.target.value)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] p-4 font-medium tracking-widest text-base w-full"
                        placeholder="Color Hex Code"
                        type="text"
                    />

                    <Eyedropper className="absolute w-[30px] h-[30px] right-2 text-grayscale-900" />
                </div>
            </div>
        </div>
    );
};

export default FamilyCMSColorPicker;
