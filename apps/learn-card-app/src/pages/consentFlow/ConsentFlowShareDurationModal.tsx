import React from 'react';
import moment from 'moment';

import AppDatetime from '../../components/datetime/AppDatetime';
import { useAppOverlayModal } from '../../components/overlays/useAppOverlayModal';
import { AppCol, AppGrid, AppRow } from '../../components/layout';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import Calendar from '../../components/svgs/Calendar';
import { RadioButton } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';
import * as m from '../../paraglide/messages.js';
import { AppContent, AppHeader, AppPage, AppToolbar } from '../../components/chrome';

const defaultDate = moment().add(6, 'months').toISOString(); // sets the shareable expiration date 6 months from today

const ConsentFlowShareDurationModal: React.FC<{
    shareDuration: {
        oneTimeShare: boolean;
        customDuration: string;
    };
    setShareDuration: React.Dispatch<
        React.SetStateAction<{
            oneTimeShare: boolean;
            customDuration: string;
        }>
    >;
    handleCloseModal: () => void;
}> = ({ shareDuration, setShareDuration, handleCloseModal }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const liveSyncingSelected = !shareDuration.oneTimeShare && !shareDuration.customDuration;
    const oneTimeSelected = shareDuration.oneTimeShare;
    const customDurationSelected = Boolean(shareDuration.customDuration);

    const handleStateChange = <Key extends keyof typeof shareDuration>(
        propName: Key,
        value: (typeof shareDuration)[Key]
    ) => {
        setShareDuration(prevState => {
            return {
                ...prevState,
                [propName]: value,
            };
        });
    };

    const [presentDatePicker] = useAppOverlayModal(
        <div className="w-full h-full transparent flex items-center justify-center">
            <AppDatetime
                onIonChange={e => {
                    handleStateChange('customDuration', moment(e.detail.value).toISOString());
                    handleStateChange('oneTimeShare', false);
                }}
                value={
                    shareDuration?.customDuration
                        ? moment(shareDuration?.customDuration).format('YYYY-MM-DD')
                        : null
                }
                id="datetime"
                presentation="date"
                className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                showDefaultButtons
                color={primaryColor}
                max="2050-12-31"
                min={moment().format('YYYY-MM-DD')}
            />
        </div>
    );

    return (
        <AppPage>
            <AppContent fullscreen>
                <AppHeader className="ion-no-border mt-[25px]">
                    <AppToolbar className="ion-no-border" color="white">
                        <AppGrid>
                            <AppRow className="w-full flex flex-col items-center justify-center">
                                <AppRow className="w-full max-w-[600px] flex items-center justify-between">
                                    <AppCol className="flex flex-1 justify-start items-center border-b-2 border-b-grayscale-200 pb-4">
                                        <button
                                            className="text-white p-0 mr-[10px]"
                                            aria-label="Back button"
                                            onClick={handleCloseModal}
                                        >
                                            <CaretLeft className="h-auto w-3 text-grayscale-900" />
                                        </button>
                                        <h3 className="text-grayscale-900 flex items-center justify-start font-poppins font-medium text-xl">
                                            {m['common.share']()}
                                        </h3>
                                    </AppCol>
                                </AppRow>
                            </AppRow>
                        </AppGrid>
                    </AppToolbar>
                </AppHeader>
                <AppGrid className="flex items-center justify-center flex-col w-full px-4 pb-14">
                    <AppRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] rounded-[20px]">
                        <div
                            role="radiogroup"
                            aria-label={m['consentFlow.shareDuration']()}
                            className="w-full"
                        >
                            <AppRow className="w-full flex flex-col items-center justify-center border-b-2 border-b-grayscale-200 mb-2 mt-2 pb-4">
                                <AppCol className="flex items-center justify-between w-full ion-padding">
                                    <p className="text-lg font-medium">
                                        {m['consentFlow.sync.liveSyncing']()}
                                    </p>
                                    <RadioButton
                                        aria-label={m['consentFlow.sync.liveSyncing']()}
                                        checked={liveSyncingSelected}
                                        tabIndex={liveSyncingSelected ? 0 : -1}
                                        onClick={() => {
                                            handleStateChange('oneTimeShare', false);
                                            handleStateChange('customDuration', '');
                                        }}
                                    />
                                </AppCol>
                            </AppRow>
                            <AppRow className="w-full flex flex-col items-center justify-center border-b-2 border-b-grayscale-200 mb-2 mt-2 pb-4">
                                <AppCol className="flex items-center justify-between w-full ion-padding">
                                    <p className="text-lg font-medium">
                                        {m['consentFlow.shareOneTimeOnly']()}
                                    </p>
                                    <RadioButton
                                        aria-label={m['consentFlow.shareOneTimeOnly']()}
                                        checked={shareDuration.oneTimeShare}
                                        tabIndex={oneTimeSelected ? 0 : -1}
                                        onClick={() => {
                                            handleStateChange('customDuration', '');
                                            handleStateChange('oneTimeShare', true);
                                        }}
                                    />
                                </AppCol>
                            </AppRow>
                            <AppRow className="w-full flex flex-col items-center justify-center mt-2">
                                <AppCol className="flex items-center justify-between w-full ion-padding">
                                    <p className="text-lg font-medium">
                                        {m['consentFlow.customDuration']()}
                                    </p>
                                    <RadioButton
                                        aria-label={m['consentFlow.customDuration']()}
                                        checked={customDurationSelected}
                                        tabIndex={customDurationSelected ? 0 : -1}
                                        onClick={() => {
                                            handleStateChange('oneTimeShare', false);

                                            if (!shareDuration.customDuration) {
                                                handleStateChange('customDuration', defaultDate);
                                            }
                                        }}
                                    />
                                </AppCol>
                            </AppRow>
                        </div>
                        <div className="flex flex-col items-center justify-center w-full mb-2 mt-4 px-4">
                            <p className="w-full text-left mb-2 pl-2">
                                Share permission expires on:{' '}
                            </p>
                            <button
                                className="w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] px-[16px] py-[12px] font-medium tracking-widest text-base"
                                onClick={() => {
                                    presentDatePicker({
                                        backdropDismiss: true,
                                        showBackdrop: false,
                                        cssClass: 'flex items-center justify-center',
                                    });
                                }}
                            >
                                {shareDuration?.customDuration
                                    ? moment(shareDuration?.customDuration).format(
                                          'MMMM Do, YYYY - hh:mm A'
                                      )
                                    : 'Duration'}
                                <Calendar className="w-[30px] text-grayscale-700" />
                            </button>
                        </div>
                    </AppRow>
                </AppGrid>
            </AppContent>
        </AppPage>
    );
};

export default ConsentFlowShareDurationModal;
