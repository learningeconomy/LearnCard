import React from 'react';

import { IonRow, IonCol, IonToggle } from '@ionic/react';
import CaretLeft from '../svgs/CaretLeft';

import {
    pushNotificationSettingOptions,
    PushNotificationsSettingsState,
    PushNotificationSettingsEnum,
} from './pushNotifications.helpers';
import ModalLayout from '../../layout/ModalLayout';

const PushNotificationsSettings: React.FC<{
    handleCloseModal: () => void;
    settings: PushNotificationsSettingsState;
    handleStateChange: (settingsType: PushNotificationSettingsEnum, settingState: boolean) => void;
}> = ({ handleCloseModal, settings, handleStateChange }) => {
    const settingsList = pushNotificationSettingOptions.map(setting => {
        return (
            <IonRow key={setting.id} className="w-full flex items-center justify-center px-2">
                <IonCol className="w-full max-w-[600px] flex-col ion-padding">
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
                            color="indigo-700"
                        />
                    </div>
                    <p className="text-left p-0 pt-2 pb-5 m-0 text-xs border-b-[1px] border-grayscale-200">
                        {setting.description}
                    </p>
                </IonCol>
            </IonRow>
        );
    });

    return (
        <ModalLayout handleOnClick={handleCloseModal}>
            <IonRow className="flex items-center justify-center px-4">
                <IonCol className="w-full flex justify-start items-center text black max-w-[600px]">
                    <button
                        className="text-grayscale-50 p-0 mr-[10px]"
                        onClick={() => handleCloseModal()}
                    >
                        <CaretLeft className="h-auto w-3 text-grayscale-900" />
                    </button>
                    <p className="font-bold text-black font-mouse text-3xl">
                        Edit Notification Settings
                    </p>
                </IonCol>
            </IonRow>

            {settingsList}
        </ModalLayout>
    );
};

export default PushNotificationsSettings;
