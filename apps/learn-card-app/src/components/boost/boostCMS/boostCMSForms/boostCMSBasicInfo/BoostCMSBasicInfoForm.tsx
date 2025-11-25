import React, { useState } from 'react';
import moment from 'moment';

import { IonRow, IonCol, IonTextarea, IonToggle, IonDatetime, useIonModal } from '@ionic/react';
import Calendar from '../../../../svgs/Calendar';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import LocationIcon from 'learn-card-base/svgs/LocationIcon';
import LocationSearch from 'apps/learn-card-app/src/components/locationSearch/LocationSearch';

import { BoostCMSState } from '../../../boost';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { AddressSpec } from 'apps/learn-card-app/src/components/locationSearch/location.helpers';

import useTheme from '../../../../../theme/hooks/useTheme';

const BoostCMSBasicInfoForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const basicInfo = state?.basicInfo;
    const boostType = state?.basicInfo?.type;

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [showAbout, setShowAbout] = useState<boolean>(true);

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

    const [presentDatePicker, dismissDatePicker] = useIonModal(
        <div className="w-full h-full transparent flex items-center justify-center">
            <IonDatetime
                onIonChange={e => {
                    const isoString = moment(e.detail.value).toISOString();
                    handleStateChange('expirationDate', isoString);
                }}
                value={
                    state?.basicInfo?.expirationDate
                        ? moment(state?.basicInfo?.expirationDate).format('YYYY-MM-DDTHH:mm')
                        : undefined
                }
                id="datetime"
                presentation="date-time"
                className="bg-white text-black rounded-[20px] z-50"
                showDefaultButtons
                showDefaultTimeLabel
                color={primaryColor}
                max="2050-12-31T23:59"
                min={moment().format('YYYY-MM-DDTHH:mm')}
                disabled={disabled}
            />
        </div>
    );

    const [presentCenterModal, dismissCenterModal] = useIonModal(LocationSearch, {
        showCloseButton: true,
        handleLocationStateChange: handleAddressStateChange,
        handleCloseModal: () => dismissCenterModal(),
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(LocationSearch, {
        handleLocationStateChange: handleAddressStateChange,
        handleCloseModal: () => dismissSheetModal(),
    });

    const isID = boostType === BoostCategoryOptionsEnum.id;
    const isMembership = boostType === BoostCategoryOptionsEnum.membership;

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="font-poppins font-medium text-grayscale-900 text-lg p-0 m-0">
                    About
                </h1>
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
                    {isID ||
                        (isMembership && (
                            <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                                <IonTextarea
                                    autocapitalize="on"
                                    value={basicInfo?.issuerName}
                                    onIonInput={e =>
                                        handleStateChange('issuerName', e.detail.value)
                                    }
                                    placeholder="Issuer Name"
                                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base"
                                    rows={2}
                                    disabled={disabled}
                                />
                            </div>
                        ))}
                    <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                        <IonTextarea
                            autocapitalize="on"
                            value={basicInfo?.description}
                            onIonInput={e => handleStateChange('description', e.detail.value)}
                            placeholder="What is this boost for?"
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium  text-base"
                            rows={3}
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                        <IonTextarea
                            autocapitalize="on"
                            value={basicInfo?.narrative}
                            onIonInput={e => handleStateChange('narrative', e.detail.value)}
                            placeholder="How do you earn this boost?"
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium  text-base"
                            rows={3}
                            disabled={disabled}
                        />
                    </div>
                    {(isID || isMembership) && (
                        <div className="flex items-center justify-between w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                            <button
                                className="bg-grayscale-100 text-grayscale-600 rounded-[15px] font-medium tracking-widest text-base modal-btn-desktop w-full line-clamp-1 text-left"
                                onClick={() =>
                                    presentCenterModal({
                                        cssClass: 'center-modal user-options-modal',
                                        backdropDismiss: false,
                                        showBackdrop: false,
                                    })
                                }
                                disabled={disabled}
                            >
                                {state?.address.streetAddress
                                    ? state?.address.streetAddress
                                    : 'Location'}
                            </button>
                            <button
                                className="bg-grayscale-100 text-grayscale-600 rounded-[15px] font-medium tracking-widest text-base modal-btn-mobile w-full line-clamp-1 text-left"
                                onClick={() => {
                                    presentSheetModal({
                                        cssClass: 'mobile-modal user-options-modal',
                                        initialBreakpoint: 0.8,
                                        breakpoints: [0, 0.8, 0.9, 1],
                                        handleBehavior: 'cycle',
                                    });
                                }}
                                disabled={disabled}
                            >
                                {state?.address.streetAddress
                                    ? state?.address.streetAddress
                                    : 'Location'}
                            </button>
                            <LocationIcon className="text-grayscale-600" />
                        </div>
                    )}

                    <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                        <p className="text-grayscale-900 font-medium w-10/12">Credential Expires</p>
                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            onIonChange={() => {
                                const expiresValue = !basicInfo?.credentialExpires;
                                handleStateChange('credentialExpires', expiresValue);
                                //if we are toggling the value to false (eg does not expire, clear expiration date if exists)
                                if (!expiresValue) {
                                    handleStateChange('expirationDate', null);
                                }
                            }}
                            checked={basicInfo?.credentialExpires}
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex flex-col items-center justify-center w-full mb-2 mt-2">
                        {basicInfo?.credentialExpires && (
                            <button
                                disabled={disabled}
                                className="w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] px-[16px] py-[12px] font-medium tracking-widest text-base"
                                onClick={() => {
                                    presentDatePicker({
                                        backdropDismiss: true,
                                        showBackdrop: false,
                                        cssClass: 'flex items-center justify-center',
                                    });
                                }}
                            >
                                {basicInfo?.expirationDate
                                    ? moment(basicInfo?.expirationDate).format(
                                          'MMMM Do, YYYY - hh:mm A'
                                      )
                                    : 'Expiration Date'}
                                <Calendar className="w-[30px] text-grayscale-700" />
                            </button>
                        )}
                    </div>
                </IonCol>
            )}
        </IonRow>
    );
};

export default BoostCMSBasicInfoForm;
