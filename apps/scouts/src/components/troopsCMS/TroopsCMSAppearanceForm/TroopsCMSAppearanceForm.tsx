import React, { useEffect, useState } from 'react';

import { IonToggle } from '@ionic/react';
import TroopCMSWallpaperSelect from './TroopCMSWallpaperSelect';
import TroopCMSThumbnailSelect from './TroopsCMSThumbnailSelect';
import TroopsCMSColorPicker from './TroopCMSColorPicker';
import IDWallpaperSelected from '../../../assets/images/id-wallpaper-highlighted.png';
import IDThumbnailSelected from '../../../assets/images/id-thumbnail-highlighted.png';

import {
    TroopsCMSState,
    TroopsCMSViewModeEnum,
    initializeTroopState as getDefaultStyles,
    troopsIDDefaults,
} from '../troopCMSState';
import TroopsCMSAppearanceTabs, { TroopsAppearanceTabs } from './TroopsCMSAppearanceTabs';
import AddWallpaper from '../../svgs/AddWallpaper';
import { DEFAULT_COLOR_DARK, DEFAULT_COLOR_LIGHT, isFontColorDark } from '../troops.helpers';

export const TroopCMSAppearanceForm: React.FC<{
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
}> = ({ state, setState, viewMode }) => {
    const isInGlobalViewMode = viewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = viewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = viewMode === TroopsCMSViewModeEnum.troop;
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;
    const isInIDMode = isInMemberViewMode || isInLeaderViewMode;

    const appearance = isInMemberViewMode ? state?.memberID?.appearance : state?.appearance;
    const parentAppearance = state?.parentID?.appearance;
    let inheritNetworkStyles = false;
    if (isInMemberViewMode) {
        inheritNetworkStyles = state?.memberID?.appearance?.inheritNetworkStyles;
    } else if (isInLeaderViewMode) {
        inheritNetworkStyles = state?.appearance?.inheritNetworkStyles;
    } else {
        inheritNetworkStyles = state?.inheritNetworkStyles;
    }

    const activeAppearanceTab = appearance?.activeAppearanceTab;

    const [toggleStyles, setToggleStyles] = useState<boolean>(inheritNetworkStyles ?? false); // should default styles to network ?

    let isDisabled = toggleStyles; // disable editing if default styles are toggled
    if (isInIDMode) isDisabled = false;

    const network = state?.parentID;
    const networkImage =
        network?.appearance?.badgeThumbnail ?? network?.appearance?.idIssuerThumbnail ?? '';

    const [fadeBackground, setFadeBackground] = useState<boolean>(
        (isInIDMode ? appearance?.dimIdBackgroundImage : appearance?.fadeBackgroundImage) ?? false
    );
    const [repeatBackground, setRepeatBackground] = useState<boolean>(
        (isInIDMode ? appearance?.repeatIdBackgroundImage : appearance?.repeatBackgroundImage) ??
            false
    );

    const [isTextDark, setIsTextDark] = useState<boolean>(
        isFontColorDark(appearance?.fontColor) ?? DEFAULT_COLOR_DARK
    );

    const handleSetDefaultStyles = (toggleState?: boolean) => {
        setState(prevState => {
            return {
                ...prevState,
                inheritNetworkStyles: toggleState,
            };
        });
        return;
    };

    const handleStateChange = (key: string, value: any) => {
        if (isInMemberViewMode) {
            setState(prevState => {
                return {
                    ...prevState,
                    memberID: {
                        ...prevState.memberID,
                        appearance: {
                            ...prevState?.memberID?.appearance,
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
                    ...prevState?.appearance,
                    [key]: value,
                },
            };
        });
    };

    const handleTabSwitch = (tab: TroopsAppearanceTabs) => {
        handleStateChange('activeAppearanceTab', tab);
    };

    return (
        <div className="w-full flex items-center justify-center flex-col">
            {isInIDMode && (
                <>
                    <div className="w-full flex items-center justify-end border-b-solid border-b-grayscale-100 border-b-[2px] pb-2 mt-4">
                        <p className="font-notoSans text-grayscale-600 font-semibold">DISPLAY</p>
                    </div>
                    <div className="w-full flex items-end justify-between mb-2 mt-4">
                        <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                            Card
                        </h3>

                        <img src={IDThumbnailSelected} alt="id highlighted" />
                    </div>
                </>
            )}

            {!isInGlobalViewMode && !isInNetworkViewMode && !isInIDMode && (
                <div className="w-full flex items-center justify-between px-[8px] py-[8px] mt-4">
                    <div className="text-grayscale-900 text-lg flex items-center justify-start w-[80%] font-notoSans">
                        <div className="h-[40px] w-[40px] rounded-full bg-white mr-[10px] overflow-hidden">
                            <img
                                src={networkImage}
                                alt="network thumb"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        Use network styles
                    </div>
                    <IonToggle
                        mode="ios"
                        className="troops-cms-toggle"
                        onIonChange={e => {
                            setToggleStyles(!toggleStyles);
                            handleSetDefaultStyles(!toggleStyles);
                        }}
                        checked={toggleStyles}
                    />
                </div>
            )}

            {isInIDMode && (
                <TroopCMSThumbnailSelect
                    state={state}
                    setState={setState}
                    viewMode={viewMode}
                    disabled={isDisabled}
                    className="!m-0"
                />
            )}

            {isInIDMode && (
                <TroopsCMSAppearanceTabs
                    activeTab={activeAppearanceTab as TroopsAppearanceTabs}
                    handleTabSwitch={handleTabSwitch}
                />
            )}

            {activeAppearanceTab === TroopsAppearanceTabs.custom && isInIDMode && (
                <div className="flex items-center justify-between w-full p-2 border-b-white border-b-solid border-b-[2px]">
                    <div className="flex items-center justify-between w-full pb-2 pl-[4px]">
                        <p className="text-grayscale-900 font-notoSans text-lg flex items-center justify-start w-[80%]">
                            Fade Image
                        </p>
                        <IonToggle
                            mode="ios"
                            className={`${
                                isDisabled ? 'troops-cms-toggle-disabled' : 'troops-cms-toggle'
                            }`}
                            onIonChange={e => {
                                const isFadedBackground = !fadeBackground;
                                setFadeBackground(isFadedBackground);

                                if (isInIDMode) {
                                    handleStateChange('dimIdBackgroundImage', isFadedBackground);
                                    return;
                                }
                                handleStateChange('fadeBackgroundImage', isFadedBackground);
                            }}
                            checked={
                                !isInIDMode && state?.inheritNetworkStyles
                                    ? parentAppearance?.fadeBackgroundImage
                                    : fadeBackground
                            }
                            disabled={isDisabled}
                        />
                    </div>
                </div>
            )}

            {activeAppearanceTab === TroopsAppearanceTabs.custom && isInIDMode && (
                <div className="flex items-center justify-between w-full p-2 border-b-white border-b-solid border-b-[2px]">
                    <div className="flex items-center justify-between w-full pb-2 pl-[4px]">
                        <p className="text-grayscale-900 font-notoSans text-lg flex items-center justify-start w-[80%]">
                            Dark Text
                        </p>
                        <IonToggle
                            mode="ios"
                            className={`${
                                isDisabled ? 'troops-cms-toggle-disabled' : 'troops-cms-toggle'
                            }`}
                            onIonChange={e => {
                                const isChecked = e.detail.checked;
                                setIsTextDark(isChecked);
                                if (isChecked) {
                                    handleStateChange('fontColor', DEFAULT_COLOR_DARK);
                                } else {
                                    handleStateChange('fontColor', DEFAULT_COLOR_LIGHT);
                                }
                            }}
                            checked={isTextDark}
                            disabled={isDisabled}
                        />
                    </div>
                </div>
            )}

            {isInIDMode && (
                <div className="w-full border-b-solid border-b-grayscale-100 border-b-[2px] mb-4 mt-2" />
            )}

            {!isInIDMode && (
                <TroopCMSThumbnailSelect
                    state={state}
                    setState={setState}
                    viewMode={viewMode}
                    disabled={isDisabled}
                />
            )}

            <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full mb-[20px]">
                <div className="w-full flex items-end justify-between mb-2">
                    <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                        Wallpaper
                    </h3>

                    {isInIDMode && <img src={IDWallpaperSelected} alt="id highlighted" />}
                </div>

                {isInIDMode &&
                    activeAppearanceTab === TroopsAppearanceTabs.custom &&
                    !appearance?.idBackgroundImage && (
                        <div className="w-full flex items-center justify-between">
                            <TroopsCMSColorPicker
                                title=""
                                _color={appearance?.idBackgroundColor}
                                setState={setState}
                                state={state}
                                updateFieldKey="idBackgroundColor"
                                isDisabled={isDisabled}
                                viewMode={viewMode}
                                className="!mb-0"
                            />
                            <button
                                onClick={() => {
                                    const defaultIdImage =
                                        troopsIDDefaults[viewMode]?.idBackgroundImage;
                                    handleStateChange('idBackgroundImage', defaultIdImage);
                                    handleStateChange('idBackgroundColor', DEFAULT_COLOR_DARK);
                                }}
                                className="ml-2 flex items-center justify-center rounded-full bg-white shadow-button-bottom w-[50px] h-[50px] min-w-[50px] min-h-[50px] mt-2"
                            >
                                <AddWallpaper />
                            </button>
                        </div>
                    )}

                <div className="flex flex-col items-center justify-center w-full bg-grayscale-100 rounded-[15px] mt-4 py-2">
                    {!isInIDMode && (
                        <TroopCMSWallpaperSelect
                            state={state}
                            setState={setState}
                            viewMode={viewMode}
                            disabled={isDisabled}
                        />
                    )}

                    {((isInIDMode && activeAppearanceTab === TroopsAppearanceTabs.light) ||
                        (isInIDMode && activeAppearanceTab === TroopsAppearanceTabs.dark) ||
                        (isInIDMode &&
                            activeAppearanceTab === TroopsAppearanceTabs.custom &&
                            appearance?.idBackgroundImage)) && (
                        <TroopCMSWallpaperSelect
                            state={state}
                            setState={setState}
                            viewMode={viewMode}
                            disabled={isDisabled}
                        />
                    )}

                    {!isInIDMode && (
                        <div className="flex items-center justify-between w-full bg-grayscale-100 p-2 border-b-white border-b-solid border-b-[2px]">
                            <div className="flex items-center justify-between w-full pb-2 pl-[4px]">
                                <p className="text-grayscale-900 font-notoSans text-lg flex items-center justify-start w-[80%]">
                                    Fade Image
                                </p>
                                <IonToggle
                                    mode="ios"
                                    className={`${
                                        isDisabled
                                            ? 'troops-cms-toggle-disabled'
                                            : 'troops-cms-toggle'
                                    }`}
                                    onIonChange={e => {
                                        const isFadedBackground = !fadeBackground;
                                        setFadeBackground(isFadedBackground);

                                        if (isInIDMode) {
                                            handleStateChange(
                                                'dimIdBackgroundImage',
                                                isFadedBackground
                                            );
                                            return;
                                        }
                                        handleStateChange('fadeBackgroundImage', isFadedBackground);
                                    }}
                                    checked={
                                        !isInIDMode && state?.inheritNetworkStyles
                                            ? parentAppearance?.fadeBackgroundImage
                                            : fadeBackground
                                    }
                                    disabled={isDisabled}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-[15px] p-2">
                        <div className="flex items-center justify-between w-full py-2 pl-[4px]">
                            <p className="text-grayscale-900 font-notoSans text-lg flex items-center justify-start w-[80%]">
                                Repeat Image
                            </p>
                            <IonToggle
                                mode="ios"
                                className={`${
                                    isDisabled ? 'troops-cms-toggle-disabled' : 'troops-cms-toggle'
                                }`}
                                onIonChange={e => {
                                    const isTiledBackground = !repeatBackground;
                                    setRepeatBackground(isTiledBackground);

                                    if (isInIDMode) {
                                        handleStateChange(
                                            'repeatIdBackgroundImage',
                                            isTiledBackground
                                        );
                                        return;
                                    }
                                    handleStateChange('repeatBackgroundImage', isTiledBackground);
                                }}
                                checked={
                                    !isInIDMode && state?.inheritNetworkStyles
                                        ? parentAppearance?.repeatBackgroundImage
                                        : repeatBackground
                                }
                                disabled={isDisabled}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {!isInIDMode && (
                <TroopsCMSColorPicker
                    title="Wallpaper Background Color"
                    _color={appearance?.backgroundColor}
                    setState={setState}
                    state={state}
                    updateFieldKey="backgroundColor"
                    isDisabled={isDisabled}
                    viewMode={viewMode}
                />
            )}

            {/* {isInIDMode && (
                <>
                    <TroopsCMSColorPicker
                        title="ID Background Color"
                        _color={appearance?.idBackgroundColor}
                        setState={setState}
                        state={state}
                        updateFieldKey="idBackgroundColor"
                        isDisabled={isDisabled}
                        viewMode={viewMode}
                    />
                    <TroopsCMSColorPicker
                        title="ID Font Color"
                        _color={appearance?.fontColor}
                        setState={setState}
                        state={state}
                        updateFieldKey="fontColor"
                        isDisabled={isDisabled}
                        viewMode={viewMode}
                    />

                    <div className="w-full flex items-center justify-center pb-[15px]">
                        <div className="w-full max-w-[99%] border-b-2 border-b-solid border-b-grayscale-100" />
                    </div>

                    <TroopsCMSColorPicker
                        title="Banner Background Color"
                        _color={appearance?.accentColor}
                        setState={setState}
                        state={state}
                        updateFieldKey="accentColor"
                        isDisabled={isDisabled}
                        viewMode={viewMode}
                    />
                    <TroopsCMSColorPicker
                        title="Banner Font Color"
                        _color={appearance?.accentFontColor}
                        setState={setState}
                        state={state}
                        updateFieldKey="accentFontColor"
                        isDisabled={isDisabled}
                        viewMode={viewMode}
                    />
                </>
            )} */}
        </div>
    );
};

export default TroopCMSAppearanceForm;
