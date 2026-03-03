import React from 'react';
import moment from 'moment';

import {
    IonCol,
    IonContent,
    IonDatetime,
    IonGrid,
    IonHeader,
    IonPage,
    IonRow,
    IonToolbar,
    useIonModal,
} from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import Calendar from '../../components/svgs/Calendar';
import { RadioButton } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';

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

    const [presentDatePicker] = useIonModal(
        <div className="w-full h-full transparent flex items-center justify-center">
            <IonDatetime
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
        <IonPage>
            <IonContent fullscreen>
                <IonHeader className="ion-no-border mt-[25px]">
                    <IonToolbar className="ion-no-border" color="white">
                        <IonGrid>
                            <IonRow className="w-full flex flex-col items-center justify-center">
                                <IonRow className="w-full max-w-[600px] flex items-center justify-between">
                                    <IonCol className="flex flex-1 justify-start items-center border-b-2 border-b-grayscale-200 pb-4">
                                        <button
                                            className="text-white p-0 mr-[10px]"
                                            aria-label="Back button"
                                            onClick={handleCloseModal}
                                        >
                                            <CaretLeft className="h-auto w-3 text-grayscale-900" />
                                        </button>
                                        <h3 className="text-grayscale-900 flex items-center justify-start font-poppins font-medium text-xl">
                                            Sharing
                                        </h3>
                                    </IonCol>
                                </IonRow>
                            </IonRow>
                        </IonGrid>
                    </IonToolbar>
                </IonHeader>
                <IonGrid className="flex items-center justify-center flex-col w-full px-4 pb-14">
                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] rounded-[20px]">
                        <IonRow className="w-full flex flex-col items-center justify-center border-b-2 border-b-grayscale-200 mb-2 mt-2 pb-4">
                            <IonCol class="flex items-center justify-between w-full ion-padding">
                                <p className="text-lg font-medium">Live Syncing</p>
                                <RadioButton
                                    checked={
                                        !shareDuration.oneTimeShare && !shareDuration.customDuration
                                    }
                                    onClick={() => {
                                        handleStateChange('oneTimeShare', false);
                                        handleStateChange('customDuration', '');
                                    }}
                                />
                            </IonCol>
                        </IonRow>
                        <IonRow className="w-full flex flex-col items-center justify-center border-b-2 border-b-grayscale-200 mb-2 mt-2 pb-4">
                            <IonCol class="flex items-center justify-between w-full ion-padding">
                                <p className="text-lg font-medium">Share One Time Only</p>
                                <RadioButton
                                    checked={shareDuration.oneTimeShare}
                                    onClick={() => {
                                        handleStateChange('customDuration', '');
                                        handleStateChange('oneTimeShare', true);
                                    }}
                                />
                            </IonCol>
                        </IonRow>
                        <IonRow className="w-full flex flex-col items-center justify-center mt-2">
                            <IonCol class="flex items-center justify-between w-full ion-padding">
                                <p className="text-lg font-medium">Custom Duration</p>
                                <RadioButton
                                    checked={Boolean(shareDuration.customDuration)}
                                    onClick={() => {
                                        handleStateChange('oneTimeShare', false);

                                        if (!shareDuration.customDuration) {
                                            handleStateChange('customDuration', defaultDate);
                                        }
                                    }}
                                />
                            </IonCol>

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
                        </IonRow>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ConsentFlowShareDurationModal;
