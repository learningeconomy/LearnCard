import React, { useState } from 'react';
import moment from 'moment';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonRow, IonCol, IonTextarea, IonToggle, IonDatetime, useIonModal } from '@ionic/react';
import Calendar from '../../../../svgs/Calendar';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import LocationIcon from 'learn-card-base/svgs/LocationIcon';
import LocationSearch from '../../../../locationSearch/LocationSearch';

import { BoostCMSState } from '../../../boost';
import {
    BoostCategoryOptionsEnum,
    boostCategoryOptions,
} from '../../../boost-options/boostOptions';
import { AddressSpec } from '../../../../locationSearch/location.helpers';

const BoostCMSBasicInfoForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
    overrideCustomize?: boolean;
}> = ({ state, setState, disabled = false, overrideCustomize }) => {
    const flags = useFlags();
    const basicInfo = state?.basicInfo;
    const boostType = state?.basicInfo?.type;

    const { title } = boostCategoryOptions?.[boostType];

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
                    handleStateChange('expirationDate', moment(e.detail.value).toISOString());
                }}
                value={
                    state?.basicInfo?.expirationDate
                        ? moment(state?.basicInfo?.expirationDate).format('YYYY-MM-DD')
                        : null
                }
                id="datetime"
                presentation="date"
                className="bg-white text-black rounded-[20px] shadow-3xl z-50 font-notoSans"
                showDefaultButtons
                color="indigo-500"
                max="2050-12-31"
                disabled={disabled}
                min={moment().format('YYYY-MM-DD')}
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
                <h1 className="text-black text-xl p-0 m-0 font-notoSans">About</h1>
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
                                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base font-notoSans"
                                rows={2}
                                disabled={
                                    (disabled || flags?.disableCmsCustomization) &&
                                    !overrideCustomize
                                }
                            />
                        </div>
                    )}
                    <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                        <IonTextarea
                            autocapitalize="on"
                            value={basicInfo?.description}
                            onIonInput={e => handleStateChange('description', e.detail.value)}
                            placeholder={`What is this ${title} for?`}
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base font-notoSans ${
                                disabled ? '!opacity-60' : ''
                            }`}
                            rows={3}
                            disabled={
                                (disabled || flags?.disableCmsCustomization) && !overrideCustomize
                            }
                        />
                    </div>
                    <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                        <IonTextarea
                            autocapitalize="on"
                            value={basicInfo?.narrative}
                            onIonInput={e => handleStateChange('narrative', e.detail.value)}
                            placeholder={`How do you earn this ${title}?`}
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base font-notoSans ${
                                disabled ? '!opacity-60' : ''
                            }`}
                            rows={10}
                            disabled={
                                (disabled || flags?.disableCmsCustomization) && !overrideCustomize
                            }
                        />
                    </div>

                    {(isID || isMembership) && (
                        <div className="flex items-center justify-between w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                            <button
                                className="bg-grayscale-100 text-grayscale-600 rounded-[15px] font-medium text-base modal-btn-desktop w-full line-clamp-1 font-notoSans"
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
                                className="bg-grayscale-100 text-grayscale-600 rounded-[15px] font-medium text-base modal-btn-mobile w-full line-clamp-1 font-notoSans"
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

                    {!flags?.disableCmsCustomization && (
                        <>
                            <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                                <p className="text-grayscale-900 font-medium w-10/12 font-notoSans">
                                    Credential Expires
                                </p>
                                <IonToggle
                                    mode="ios"
                                    color="indigo-700"
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
                                        className="w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] px-[16px] py-[12px] font-medium tracking-widest text-base font-notoSans"
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
                                                  'MMMM Do, YYYY'
                                              )
                                            : 'Expiration Date'}
                                        <Calendar className="w-[30px] text-grayscale-700" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </IonCol>
            )}
        </IonRow>
    );
};

export default BoostCMSBasicInfoForm;
