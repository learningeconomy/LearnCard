import React, { useState } from 'react';

import { IonToggle } from '@ionic/react';
import FamilyCMSWallpaperSelect from './FamilyCMSWallpaperSelect';
import FamilyCMSThumbnailSelect from './FamilyCMSThumbnailSelect';
import FamilyCMSColorPicker from './FamilyCMSColorPicker';

import { FamilyCMSState } from '../familyCMSState';

export const FamilyCMSAppearanceForm: React.FC<{
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
}> = ({ state, setState }) => {
    const familyAppearance = state?.appearance;

    const [fadeBackground, setFadeBackground] = useState<boolean>(
        familyAppearance?.fadeBackgroundImage ?? false
    );
    const [repeatBackground, setRepeatBackground] = useState<boolean>(
        familyAppearance?.repeatBackgroundImage ?? false
    );

    const handleSetState = (topLevelKey: string, key: string, value: string) => {
        setState(prevState => {
            return {
                ...prevState,
                [topLevelKey]: {
                    ...prevState?.[topLevelKey],
                    [key]: value,
                },
            };
        });
    };

    return (
        <div className="w-full flex items-center justify-center flex-col">
            <FamilyCMSThumbnailSelect state={state} setState={setState} />

            {/* <FamilyCMSColorPicker
                title="Header Background Color"
                _color={state?.appearance?.headerBackgroundColor}
                updateFieldKey="headerBackgroundColor"
                state={state}
                setState={setState}
            />

            <FamilyCMSColorPicker
                title="Header Font Color"
                _color={state?.appearance?.headerFontColor}
                updateFieldKey="headerFontColor"
                state={state}
                setState={setState}
            /> */}

            <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full mb-[20px]">
                <h3 className="text-grayscale-900 font-poppins font-normal text-left w-full text-[20px]">
                    Wallpaper
                </h3>

                <div className="flex flex-col items-center justify-center w-full bg-grayscale-100 rounded-[15px] mt-4 py-2">
                    <FamilyCMSWallpaperSelect state={state} setState={setState} />

                    <div className="flex items-center justify-between w-full bg-grayscale-100 p-2 border-b-white border-b-solid border-b-[2px]">
                        <div className="flex items-center justify-between w-full pb-2 pl-[4px]">
                            <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                                Fade background
                            </p>
                            <IonToggle
                                mode="ios"
                                className="family-cms-toggle"
                                onIonChange={e => {
                                    setFadeBackground(!fadeBackground);
                                    handleSetState(
                                        'appearance',
                                        'fadeBackgroundImage',
                                        !fadeBackground
                                    );
                                }}
                                checked={fadeBackground}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-[15px] p-2">
                        <div className="flex items-center justify-between w-full py-2 pl-[4px]">
                            <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                                Repeat background
                            </p>
                            <IonToggle
                                mode="ios"
                                className="family-cms-toggle"
                                onIonChange={e => {
                                    setRepeatBackground(!repeatBackground);
                                    handleSetState(
                                        'appearance',
                                        'repeatBackgroundImage',
                                        !repeatBackground
                                    );
                                }}
                                checked={repeatBackground}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <FamilyCMSColorPicker
                title="Wallpaper Background"
                _color={state?.appearance?.backgroundColor}
                updateFieldKey="backgroundColor"
                state={state}
                setState={setState}
            />
        </div>
    );
};

export default FamilyCMSAppearanceForm;
