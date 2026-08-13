import React, { useState } from 'react';

import { IonRow, IonCol, IonTextarea } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import LocationIcon from 'learn-card-base/svgs/LocationIcon';
import LocationSearch from '../../../../locationSearch/LocationSearch';

import { BoostCMSState } from '../../../boost';
import { BoostCategoryOptionsEnum, useModal, ModalTypes } from 'learn-card-base';
import { AddressSpec } from '../../../../locationSearch/location.helpers';
import { SetState } from 'packages/shared-types/dist';
import { boostCategoryOptions } from '../../../boost-options/boostOptions';

const BoostCMSAdvancedSettingsForm: React.FC<{
    state: BoostCMSState;
    setState: SetState<BoostCMSState>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const basicInfo = state?.basicInfo;
    const boostType = state?.basicInfo?.type;

    const { title } = boostCategoryOptions[boostType as BoostCategoryOptionsEnum];

    const [showAbout, setShowAbout] = useState<boolean>(false);

    const handleStateChange = (propName: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                basicInfo: {
                    ...prevState.basicInfo,
                    [propName]: value,
                },
            };
        });
    };

    const handleAddressStateChange = (address: AddressSpec) => {
        setState(prevState => {
            return {
                ...prevState,
                address: {
                    ...address,
                },
            };
        });
    };

    const { newModal: newLocationModal, closeModal: closeLocationModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.FullScreen,
    });

    const openLocationModal = () => {
        newLocationModal(
            <LocationSearch
                showCloseButton={true}
                handleLocationStateChange={handleAddressStateChange}
                handleCloseModal={closeLocationModal}
            />
        );
    };

    const isID = boostType === BoostCategoryOptionsEnum.id;
    const isMembership = boostType === BoostCategoryOptionsEnum.membership;

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="text-black text-2xl p-0 m-0">Advanced Settings</h1>
                <button onClick={() => setShowAbout(!showAbout)}>
                    <CaretLeft
                        className={`h-auto w-3 text-grayscale-800 ${
                            showAbout ? 'rotate-[-90deg]' : 'rotate-180'
                        }`}
                    />
                </button>
            </IonCol>
            {showAbout && (
                <IonCol size="12" className="w-full bg-white">
                    {(isID || isMembership) && (
                        <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                            <IonTextarea
                                autocapitalize="on"
                                value={basicInfo?.issuerName}
                                onIonInput={e => handleStateChange('issuerName', e.detail.value)}
                                placeholder="Issuer Name"
                                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base"
                                rows={2}
                                disabled
                            />
                        </div>
                    )}
                    <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                        <IonTextarea
                            autocapitalize="on"
                            value={basicInfo?.description}
                            onIonInput={e => handleStateChange('description', e.detail.value)}
                            placeholder={`What is this ${title} for?`}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base"
                            rows={3}
                            disabled
                        />
                    </div>
                    <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                        <IonTextarea
                            autocapitalize="on"
                            value={basicInfo?.narrative}
                            onIonInput={e => handleStateChange('narrative', e.detail.value)}
                            placeholder={`How do you earn this ${title}?`}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base"
                            rows={10}
                            disabled
                        />
                    </div>

                    {(isID || isMembership) && (
                        <div className="flex items-center justify-between w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                            <button
                                className="bg-grayscale-100 text-grayscale-600 rounded-[15px] font-medium text-base w-full line-clamp-1 text-left"
                                onClick={() => openLocationModal()}
                                disabled={disabled}
                            >
                                {state?.address.streetAddress
                                    ? state?.address.streetAddress
                                    : 'Location'}
                            </button>
                            <LocationIcon className="text-grayscale-600" />
                        </div>
                    )}
                </IonCol>
            )}
        </IonRow>
    );
};

export default BoostCMSAdvancedSettingsForm;
