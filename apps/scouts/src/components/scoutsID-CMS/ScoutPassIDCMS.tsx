import React, { useEffect, useState } from 'react';

import { IonPage, IonToggle } from '@ionic/react';
import ScoutPassIDCMSLayout from './ScoutPassIDCMSLayout';
import ScoutPassIDCMSFooter from './ScoutPassIDCMSFooter';
import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import ScoutPassID from './ScoutPassID';

import IDWallpaperSelected from '../../assets/images/id-wallpaper-highlighted.png';
import ContainerWallpaperSelected from '../../assets/images/container-wallpaper-highlighted.png';
import ScoutPassIDContainerWallpaperSelect from './ScoutPassIDContainerWallpaperSelect';
import ScoutPassIDWallpaperSelect from './ScoutPassIDWallpaperSelect';
import ScoutPassIDCMSTabs, { ScoutPassIDCMSTabsEnum } from './ScoutPassIDCMSTabs';
import ScoutPassIDCMSColorPicker from './ScoutPassIDCMSColorPicker';
import AddWallpaper from '../svgs/AddWallpaper';
import { userAccount, UserCMSAppearance } from './scouts-cms.helpers';

import {
    DEFAULT_SCOUTS_ID_WALLPAPER,
    DEFAULT_SCOUTS_WALLPAPER,
    getScoutPassIDBackgroundColor,
    getScoutPassIDStyleDefaults,
} from './scouts-cms.helpers';

// different editor modes the CMS can be opened in
export enum ScoutPassIdCMSEditorModeEnum {
    create = 'create',
    edit = 'edit',
}

export const ScoutPassIDCMS: React.FC<{
    user: userAccount;
    scoutPassID: UserCMSAppearance;
    handleSaveScoutPassID: (scoutPassIDUpdates: UserCMSAppearance) => void;
    handleCloseModal: () => void;
    showIssueDate?: boolean;
    viewMode?: ScoutPassIdCMSEditorModeEnum;
}> = ({
    user,
    scoutPassID,
    handleSaveScoutPassID,
    handleCloseModal,
    showIssueDate = true,
    viewMode = ScoutPassIdCMSEditorModeEnum.create,
}) => {
    const [_scoutPassID, _setScoutPassID] = useState<UserCMSAppearance>(
        getScoutPassIDStyleDefaults(scoutPassID?.presetStyle, scoutPassID)
    );
    const [activeTab, setActiveTab] = useState<ScoutPassIDCMSTabsEnum>(
        scoutPassID?.presetStyle ?? ScoutPassIDCMSTabsEnum.dark
    );

    useEffect(() => {
        if (viewMode === ScoutPassIdCMSEditorModeEnum.edit) {
            _setScoutPassID(scoutPassID);
        }
    }, []);

    const handleSetState = (key: string, value: any) => {
        _setScoutPassID(prevState => {
            return {
                ...prevState,
                [key]: value,
            };
        });
    };

    const handleTabSwitch = (tab: ScoutPassIDCMSTabsEnum) => {
        setActiveTab(tab);
        _setScoutPassID(prevState => {
            return {
                ...prevState,
                ...getScoutPassIDStyleDefaults(tab, prevState),
                ...(!_scoutPassID?.idBackgroundImage
                    ? getScoutPassIDBackgroundColor(activeTab, prevState)
                    : {}),
            };
        });
    };

    const handleSave = () => {
        handleSaveScoutPassID(_scoutPassID);
        handleCloseModal();
    };

    return (
        <IonPage>
            <ScoutPassIDCMSLayout
                scoutPassID={_scoutPassID}
                layoutClassName="!max-w-[375px] safe-area-top-margin"
            >
                <div className="rounded-t-[20px] shadow-box-bottom flex flex-col">
                    <div className="w-full flex items-center justify-center flex-col bg-white bg-opacity-70 backdrop-blur-[10px] rounded-t-[20px]">
                        <div className="w-full py-4 max-w-[335px]">
                            <ScoutPassID
                                user={user}
                                scoutPassID={_scoutPassID}
                                showIssueDate={showIssueDate}
                            />
                        </div>

                        <div className="w-full flex items-center justify-center relative mb-[-2.5px]">
                            <IDSleeve className="h-auto w-full" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-b-[20px] shadow-soft-bottom">
                    <div className="ion-padding ">
                        <div className="w-full flex items-center justify-end border-b-solid border-b-grayscale-100 border-b-[2px] pb-2">
                            <p className="font-poppins text-grayscale-600 font-semibold">DISPLAY</p>
                        </div>

                        <div className="w-full flex items-end justify-between mb-2 mt-4">
                            <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                                Card
                            </h3>

                            <img src={IDWallpaperSelected} alt="id highlighted" />
                        </div>

                        {_scoutPassID?.idBackgroundImage ? (
                            <ScoutPassIDWallpaperSelect
                                idBackgroundImage={_scoutPassID?.idBackgroundImage ?? ''}
                                handleSetState={handleSetState}
                            />
                        ) : (
                            <div className="w-full flex items-center justify-between">
                                <ScoutPassIDCMSColorPicker
                                    _color={_scoutPassID?.idBackgroundColor}
                                    updateFieldKey="idBackgroundColor"
                                    handleSetState={handleSetState}
                                />
                                <button
                                    onClick={() => {
                                        _setScoutPassID(prevState => {
                                            return {
                                                ...prevState,
                                                ...getScoutPassIDStyleDefaults(
                                                    activeTab,
                                                    prevState,
                                                    {
                                                        idBackgroundImage:
                                                            DEFAULT_SCOUTS_ID_WALLPAPER,
                                                        dimIdBackgroundImage: true,
                                                    }
                                                ),
                                            };
                                        });
                                    }}
                                    className="ml-2 flex items-center justify-center rounded-full bg-white shadow-button-bottom w-[50px] h-[50px] min-w-[50px] min-h-[50px]"
                                >
                                    <AddWallpaper />
                                </button>
                            </div>
                        )}

                        <ScoutPassIDCMSTabs
                            activeTab={activeTab}
                            handleTabSwitch={handleTabSwitch}
                        />

                        {activeTab === ScoutPassIDCMSTabsEnum.custom && (
                            <>
                                <div className="flex items-center justify-between w-full p-2 mt-2">
                                    <div className="flex items-center justify-between w-full py-2 pl-[4px]">
                                        <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                                            Fade Image
                                        </p>
                                        <IonToggle
                                            mode="ios"
                                            className="family-cms-toggle"
                                            onIonChange={e => {
                                                handleSetState(
                                                    'dimIdBackgroundImage',
                                                    !_scoutPassID?.dimIdBackgroundImage
                                                );
                                            }}
                                            checked={_scoutPassID?.dimIdBackgroundImage}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full p-2 mt-2">
                                    <div className="flex items-center justify-between w-full py-2 pl-[4px]">
                                        <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                                            Dark Text
                                        </p>
                                        <IonToggle
                                            mode="ios"
                                            className="family-cms-toggle"
                                            onIonChange={e => {
                                                handleSetState(
                                                    'fontColor',
                                                    _scoutPassID.fontColor === '#EFF0F5'
                                                        ? '#353E64'
                                                        : '#EFF0F5'
                                                );
                                            }}
                                            checked={
                                                _scoutPassID.fontColor === '#353E64' ? true : false
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="h-[2px] w-full border-b-solid border-b-grayscale-100 border-b-[2px] mt-4" />

                    <div className="ion-padding ">
                        <div className="w-full flex items-end justify-between mb-2 mt-4">
                            <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                                Wallpaper
                            </h3>

                            <img src={ContainerWallpaperSelected} alt="container highlighted" />
                        </div>

                        {_scoutPassID?.backgroundImage ? (
                            <ScoutPassIDContainerWallpaperSelect
                                backgroundImage={_scoutPassID?.backgroundImage ?? ''}
                                handleSetState={handleSetState}
                            />
                        ) : (
                            <div className="w-full flex items-center justify-between">
                                <ScoutPassIDCMSColorPicker
                                    _color={_scoutPassID?.backgroundColor}
                                    updateFieldKey="backgroundColor"
                                    handleSetState={handleSetState}
                                />
                                <button
                                    onClick={() => {
                                        _setScoutPassID(prevState => {
                                            return {
                                                ...prevState,
                                                ...getScoutPassIDStyleDefaults(
                                                    activeTab,
                                                    prevState,
                                                    {
                                                        backgroundImage: DEFAULT_SCOUTS_WALLPAPER,
                                                        fadeBackgroundImage: true,
                                                    }
                                                ),
                                            };
                                        });
                                    }}
                                    className="ml-2 flex items-center justify-center rounded-full bg-white shadow-button-bottom w-[50px] h-[50px] min-w-[50px] min-h-[50px]"
                                >
                                    <AddWallpaper />
                                </button>
                            </div>
                        )}

                        <div
                            className={`flex items-center justify-between w-full bg-grayscale-100  p-2 ${
                                _scoutPassID?.backgroundImage
                                    ? 'rounded-bl-[15px] rounded-br-[15px]'
                                    : 'rounded-[15px]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full py-2 pl-[4px]">
                                <p className="text-grayscale-900 font-poppins text-lg flex items-center justify-start w-[80%]">
                                    Repeat background
                                </p>
                                <IonToggle
                                    mode="ios"
                                    className="family-cms-toggle"
                                    onIonChange={e => {
                                        handleSetState(
                                            'repeatBackgroundImage',
                                            !_scoutPassID?.repeatBackgroundImage
                                        );
                                    }}
                                    checked={_scoutPassID?.repeatBackgroundImage}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ScoutPassIDCMSLayout>
            <ScoutPassIDCMSFooter
                user={user}
                scoutPassID={_scoutPassID}
                handleSave={handleSave}
                handleCloseModal={handleCloseModal}
            />
        </IonPage>
    );
};

export default ScoutPassIDCMS;
