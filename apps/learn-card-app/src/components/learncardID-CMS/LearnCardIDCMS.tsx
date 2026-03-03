import React, { useEffect, useState } from 'react';

import { IonPage, IonToggle } from '@ionic/react';
import LearnCardIDCMSLayout from './LearnCardIDCMSLayout';
import LearnCardIDCMSFooter from './LearCardIDCMSFooter';
import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import LearnCardID from './LearnCardID';
import IDWallpaperSelected from '../../assets/images/id-wallpaper-highlighted.png';
import ContainerWallpaperSelected from '../../assets/images/container-wallpaper-highlighted.png';
import LearnCardIDContainerWallpaperSelect from './LearnCardIDContainerWallpaperSelect';
import LearnCardIDWallpaperSelect from './LearnCardIDWallpaperSelect';
import LearnCardIDCMSTabs, { LearnCardIDCMSTabsEnum } from './LearnCardIDCMSTabs';
import LearnCardIDCMSColorPicker from './LearnCardIDCMSColorPicker';
import AddWallpaper from '../svgs/AddWallpaper';

import { FamilyChildAccount, FamilyCMSAppearance } from '../familyCMS/familyCMSState';
import {
    DEFAULT_LEARNCARD_ID_WALLPAPER,
    DEFAULT_LEARNCARD_WALLPAPER,
    getLearnCardIDBackgroundColor,
    getLearnCardIDStyleDefaults,
} from './learncard-cms.helpers';

// different editor modes the CMS can be opened in
export enum LearnCardIdCMSEditorModeEnum {
    create = 'create',
    edit = 'edit',
}

export const LearnCardIDCMS: React.FC<{
    user: FamilyChildAccount;
    learnCardID: FamilyCMSAppearance;
    handleSaveLearnCardID: (learnCardIDUpdates: FamilyCMSAppearance) => void;
    handleCloseModal: () => void;
    showIssueDate?: boolean;
    viewMode?: LearnCardIdCMSEditorModeEnum;
}> = ({
    user,
    learnCardID,
    handleSaveLearnCardID,
    handleCloseModal,
    showIssueDate = true,
    viewMode = LearnCardIdCMSEditorModeEnum.create,
}) => {
    const [_learnCardID, _setLearnCardID] = useState<FamilyCMSAppearance>(
        getLearnCardIDStyleDefaults(learnCardID?.presetStyle, learnCardID)
    );
    const [activeTab, setActiveTab] = useState<LearnCardIDCMSTabsEnum>(
        learnCardID?.presetStyle ?? LearnCardIDCMSTabsEnum.dark
    );

    useEffect(() => {
        if (viewMode === LearnCardIdCMSEditorModeEnum.edit) {
            _setLearnCardID(learnCardID);
        }
    }, []);

    const handleSetState = (key: string, value: any) => {
        _setLearnCardID(prevState => {
            return {
                ...prevState,
                [key]: value,
            };
        });
    };

    const handleTabSwitch = (tab: LearnCardIDCMSTabsEnum) => {
        setActiveTab(tab);
        _setLearnCardID(prevState => {
            return {
                ...prevState,
                ...getLearnCardIDStyleDefaults(tab, prevState),
                ...(!_learnCardID?.idBackgroundImage
                    ? getLearnCardIDBackgroundColor(activeTab, prevState)
                    : {}),
            };
        });
    };

    const handleSave = () => {
        handleSaveLearnCardID(_learnCardID);
        handleCloseModal();
    };

    return (
        <IonPage>
            <LearnCardIDCMSLayout
                learnCardID={_learnCardID}
                layoutClassName="!max-w-[375px] safe-area-top-margin"
            >
                <div className="rounded-t-[20px] shadow-box-bottom flex flex-col">
                    <div className="w-full flex items-center justify-center flex-col bg-white bg-opacity-70 backdrop-blur-[10px] rounded-t-[20px]">
                        <div className="w-full py-4 max-w-[335px]">
                            <LearnCardID
                                user={user}
                                learnCardID={_learnCardID}
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

                        {_learnCardID?.idBackgroundImage ? (
                            <LearnCardIDWallpaperSelect
                                idBackgroundImage={_learnCardID?.idBackgroundImage ?? ''}
                                handleSetState={handleSetState}
                            />
                        ) : (
                            <div className="w-full flex items-center justify-between">
                                <LearnCardIDCMSColorPicker
                                    _color={_learnCardID?.idBackgroundColor}
                                    updateFieldKey="idBackgroundColor"
                                    handleSetState={handleSetState}
                                />
                                <button
                                    onClick={() => {
                                        _setLearnCardID(prevState => {
                                            return {
                                                ...prevState,
                                                ...getLearnCardIDStyleDefaults(
                                                    activeTab,
                                                    prevState,
                                                    {
                                                        idBackgroundImage:
                                                            DEFAULT_LEARNCARD_ID_WALLPAPER,
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

                        <LearnCardIDCMSTabs
                            activeTab={activeTab}
                            handleTabSwitch={handleTabSwitch}
                        />

                        {activeTab === LearnCardIDCMSTabsEnum.custom && (
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
                                                    !_learnCardID?.dimIdBackgroundImage
                                                );
                                            }}
                                            checked={_learnCardID?.dimIdBackgroundImage}
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
                                                    _learnCardID.fontColor === '#EFF0F5'
                                                        ? '#353E64'
                                                        : '#EFF0F5'
                                                );
                                            }}
                                            checked={
                                                _learnCardID.fontColor === '#353E64' ? true : false
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

                        {_learnCardID?.backgroundImage ? (
                            <LearnCardIDContainerWallpaperSelect
                                backgroundImage={_learnCardID?.backgroundImage ?? ''}
                                handleSetState={handleSetState}
                            />
                        ) : (
                            <div className="w-full flex items-center justify-between">
                                <LearnCardIDCMSColorPicker
                                    _color={_learnCardID?.backgroundColor}
                                    updateFieldKey="backgroundColor"
                                    handleSetState={handleSetState}
                                />
                                <button
                                    onClick={() => {
                                        _setLearnCardID(prevState => {
                                            return {
                                                ...prevState,
                                                ...getLearnCardIDStyleDefaults(
                                                    activeTab,
                                                    prevState,
                                                    {
                                                        backgroundImage:
                                                            DEFAULT_LEARNCARD_WALLPAPER,
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
                                _learnCardID?.backgroundImage
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
                                            !_learnCardID?.repeatBackgroundImage
                                        );
                                    }}
                                    checked={_learnCardID?.repeatBackgroundImage}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </LearnCardIDCMSLayout>
            <LearnCardIDCMSFooter
                user={user}
                learnCardID={_learnCardID}
                handleSave={handleSave}
                handleCloseModal={handleCloseModal}
            />
        </IonPage>
    );
};

export default LearnCardIDCMS;
