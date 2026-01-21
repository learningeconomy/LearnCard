import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import Eyedropper from 'learn-card-base/svgs/Eyedropper';
import X from 'learn-card-base/svgs/X';

import { TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { useModal, ModalTypes } from 'learn-card-base';

export const TroopsCMSColorPicker: React.FC<{
    title: string;
    _color: string;
    updateFieldKey: string;
    isDisabled?: boolean;
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    className?: string;
}> = ({ title, _color, updateFieldKey, isDisabled, state, setState, viewMode, className }) => {
    const [color, setColor] = useState<string>(_color || '#353E64');
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;

    const parentAppearance = state?.parentID?.appearance;

    const handleColorChange = (hex: string) => {
        setColor(hex);
        handleStateChange(updateFieldKey, hex);
    };

    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const openColorPicker = () => {
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
            </div>
        );
    };

    const handleColorInputOnChange = (value: string) => {
        if (value === '') {
            handleStateChange(updateFieldKey, '');
            setColor('');
            return;
        }

        const updatedValue = value.startsWith('#') ? value : `#${value}`;

        handleStateChange(updateFieldKey, updatedValue);
        setColor(updatedValue);
    };

    const handleStateChange = (key: string, value: any) => {
        if (isInMemberViewMode) {
            setState(prevState => {
                return {
                    ...prevState,
                    memberID: {
                        ...(prevState.memberID as any),
                        appearance: {
                            ...(prevState?.memberID?.appearance as any),
                            [key]: value,
                        },
                    },
                };
            });
            return;
        }

        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...(prevState?.appearance as any),
                    [key]: value,
                },
            };
        });
    };

    return (
        <div className={`flex flex-col bg-white rounded-[15px] w-full mb-[20px] ${className}`}>
            <h3 className="text-grayscale-700 font-notoSans font-normal text-left w-full text-[20px]">
                {title}
            </h3>

            <div className="w-full flex items-center justify-between p-0 m-0 mt-4">
                {isDisabled && state?.inheritNetworkStyles ? (
                    <button
                        onClick={() => {
                            openColorPicker();
                        }}
                        className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-[10px] mr-2 shadow-soft-bottom"
                        style={{
                            backgroundColor: parentAppearance?.backgroundColor
                                ? parentAppearance?.backgroundColor
                                : '#353E64',
                        }}
                        disabled={isDisabled}
                    />
                ) : (
                    <button
                        onClick={() => {
                            openColorPicker();
                        }}
                        className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-[10px] mr-2 shadow-soft-bottom"
                        style={{
                            backgroundColor: color ? color : '#353E64',
                        }}
                        disabled={isDisabled}
                    />
                )}

                <div className="relative w-full flex items-center justify-between">
                    <input
                        value={
                            isDisabled && state?.inheritNetworkStyles
                                ? parentAppearance?.backgroundColor
                                : color
                        }
                        onChange={e => handleColorInputOnChange(e.target.value)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] p-4 font-medium tracking-widest text-base w-full"
                        placeholder="Color Hex Code"
                        type="text"
                        disabled={isDisabled}
                    />

                    <Eyedropper className="absolute w-[30px] h-[30px] right-2 text-grayscale-900" />
                </div>
            </div>
        </div>
    );
};

export default TroopsCMSColorPicker;
