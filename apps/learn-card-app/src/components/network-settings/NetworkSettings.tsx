import React from 'react';

import {
    IonRow,
    IonCol,
    IonToggle,
} from '@ionic/react';
import CaretLeft from '../svgs/CaretLeft';

import {
    networkSettingOptions,
    NetworkSettingsState,
    NetworkSettingsEnum,
} from './networkSettings.helpers';
import ModalLayout from '../../layout/ModalLayout';

const NetworkSettings: React.FC<{
    handleCloseModal: () => void;
    settings: NetworkSettingsState;
    handleStateChange: (settingsType: NetworkSettingsEnum, settingState: boolean) => void;
}> = ({ handleCloseModal, settings, handleStateChange }) => {
    const settingsList = networkSettingOptions.map(setting => {
        return (
            <IonRow key={setting.id} className="w-full flex items-center justify-center px-2">
                <IonCol className="w-full max-w-[600px] flex-col ion-padding">
                    <div className="w-full flex items-center justify-between">
                        <p className="text-grayscale-900 font-semibold w-10/12">{setting.title}</p>
                        <IonToggle
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
                    <p className="text-left p-0 pt-2 pb-5 m-0 text-xs border-b-[1px] border-grayscale-200">
                        {setting.description}
                    </p>
                </IonCol>
            </IonRow>
        );
    });

    return (
        <ModalLayout handleOnClick={handleCloseModal} allowScroll>
            <IonRow className="flex items-center justify-center px-4">
                <IonCol className="w-full flex justify-start items-center text black max-w-[600px]">
                    <button
                        className="text-grayscale-50 p-0 mr-[10px]"
                        onClick={() => handleCloseModal()}
                    >
                        <CaretLeft className="h-auto w-3 text-grayscale-900" />
                    </button>
                    <p className="font-bold text-black font-poppins text-xl">
                        Edit Requested Access
                    </p>
                </IonCol>
            </IonRow>

            {settingsList}
        </ModalLayout>
    );
};

export default NetworkSettings;
