import React from 'react';

import { IonToggle } from '@ionic/react';
import CaretLeft from '../svgs/CaretLeft';

import {
    pushNotificationSettingOptions,
    PushNotificationsSettingsState,
    PushNotificationSettingsEnum,
} from './pushNotifications.helpers';

const PushNotificationsSettings: React.FC<{
    handleCloseModal: () => void;
    settings: PushNotificationsSettingsState;
    handleStateChange: (settingsType: PushNotificationSettingsEnum, settingState: boolean) => void;
}> = ({ handleCloseModal, settings, handleStateChange }) => {
    const settingsList = pushNotificationSettingOptions.map(setting => {
        return (
            <div key={setting.id} className="w-full px-6">
                <div className="w-full py-4 border-b border-grayscale-200">
                    <div className="w-full flex items-center justify-between">
                        <p className="text-grayscale-900 font-semibold w-10/12">{setting.title}</p>
                        <IonToggle
                            mode="ios"
                            checked={settings[PushNotificationSettingsEnum[setting.type]]}
                            onClick={() =>
                                handleStateChange(
                                    setting.type,
                                    settings[PushNotificationSettingsEnum[setting.type]]
                                )
                            }
                            color="emerald-700"
                        />
                    </div>
                    <p className="text-left p-0 pt-2 m-0 text-xs text-grayscale-600">
                        {setting.description}
                    </p>
                </div>
            </div>
        );
    });

    return (
        <section className="w-full pt-6 pb-2">
            <div className="w-full flex items-center px-6 pb-2">
                <button
                    type="button"
                    className="p-0 mr-[10px] text-grayscale-900"
                    onClick={handleCloseModal}
                >
                    <CaretLeft className="h-auto w-3 text-grayscale-900" />
                </button>
                <p className="font-bold text-black font-poppins text-xl">
                    Edit Notification Settings
                </p>
            </div>
            {settingsList}
        </section>
    );
};

export default PushNotificationsSettings;
