import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import Eyedropper from 'learn-card-base/svgs/Eyedropper';
import X from 'learn-card-base/svgs/X';

import { ModalTypes, useModal } from 'learn-card-base';

export const ScoutPassIDCMSColorPicker: React.FC<{
    title?: string;
    _color: string | undefined;
    updateFieldKey: string;
    handleSetState: (key: string, value: any) => void;
}> = ({ title, _color, updateFieldKey, handleSetState }) => {
    const { newModal, closeModal } = useModal();
    const [color, setColor] = useState<string>(_color ?? '#353E64');

    const handleColorChange = (hex: string) => {
        setColor(hex);
        handleSetState(updateFieldKey, hex);
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

                <HexColorPicker color={color ? color : '#353E64'} onChange={handleColorChange} />
            </div>,
            { className: '!bg-transparent !shadow-none' },
            { mobile: ModalTypes.Center, desktop: ModalTypes.Center }
        );
    };

    const handleColorInputOnChange = (value: string) => {
        let updatedValue;

        if (value !== '') updatedValue = value.startsWith('#') ? value : `#${value}`;

        handleSetState(updateFieldKey, updatedValue);
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

export default ScoutPassIDCMSColorPicker;
