import React from 'react';

import CaretLeft from '../svgs/CaretLeft';

import {
    getNetworkSettingOptions,
    NetworkSettingsState,
    NetworkSettingsEnum,
} from './networkSettings.helpers';
import ModalLayout from '../../layout/ModalLayout';
import * as m from '../../paraglide/messages.js';
import { AppToggle } from 'learn-card-base/ui/controls/AppToggle';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

const NetworkSettings: React.FC<{
    handleCloseModal: () => void;
    settings: NetworkSettingsState;
    handleStateChange: (settingsType: NetworkSettingsEnum, settingState: boolean) => void;
}> = ({ handleCloseModal, settings, handleStateChange }) => {
    const settingsList = getNetworkSettingOptions().map(setting => {
        return (
            <AppRow key={setting.id} className="w-full flex items-center justify-center px-2">
                <AppCol className="w-full max-w-[600px] flex-col ion-padding">
                    <div className="w-full flex items-center justify-between">
                        <p className="text-grayscale-900 font-semibold w-10/12">{setting.title}</p>
                        <AppToggle
                            mode="ios"
                            checked={settings[NetworkSettingsEnum[setting.type]]}
                            onClick={() =>
                                handleStateChange(
                                    setting.type,
                                    settings[NetworkSettingsEnum[setting.type]]
                                )
                            }
                            color="emerald-700"
                        />
                    </div>
                    <p className="text-left p-0 pt-2 pb-5 m-0 text-xs border-b border-grayscale-200">
                        {setting.description}
                    </p>
                </AppCol>
            </AppRow>
        );
    });

    return (
        <ModalLayout handleOnClick={handleCloseModal} allowScroll>
            <AppRow className="flex items-center justify-center">
                <AppCol className="w-full flex justify-start items-center text black max-w-[600px]">
                    <button
                        className="text-grayscale-50 p-0 mr-[10px]"
                        onClick={() => handleCloseModal()}
                    >
                        <CaretLeft className="rtl-mirror h-auto w-3 text-grayscale-900" />
                    </button>
                    <p className="font-bold text-black font-mouse text-3xl">
                        {m['networkPrompts.settings.editAccess']()}
                    </p>
                </AppCol>
            </AppRow>

            {settingsList}
        </ModalLayout>
    );
};

export default NetworkSettings;
