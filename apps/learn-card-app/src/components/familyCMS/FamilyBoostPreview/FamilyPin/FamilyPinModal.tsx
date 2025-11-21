import React from 'react';
import { createPortal } from 'react-dom';
import { ModalTypes, ProfilePicture, useCurrentUser } from 'learn-card-base';
import Backspace from '../../../svgs/Backspace';
import { IonCol, IonRow } from '@ionic/react';
import { FamilyPinViewModeEnum } from './FamilyPinWrapper';
import ForgotPinConfirmation from './ForgotPinConfirmation';

import { useModal } from 'learn-card-base';

const pinNumbersAllowed: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

type FamilyPinModalProps = {
    pin: string[];
    setPin: React.Dispatch<React.SetStateAction<string[]>>;
    errors?: Record<string, string[]>;
    skipVerification?: boolean;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    handleCloseModal: () => void;
    familyName?: string;
    viewMode: FamilyPinViewModeEnum;
    handleOnClick: () => void;
    titleOverride?: string;
    isVerifying?: boolean;
    closeButtonText?: string;
};

export const FamilyPinModal: React.FC<FamilyPinModalProps> = ({
    pin,
    setPin,
    errors,
    skipVerification = false,
    setErrors,
    handleCloseModal,
    familyName,
    viewMode = FamilyPinViewModeEnum.create,
    handleOnClick,
    titleOverride,
    isVerifying = false,
    closeButtonText,
}) => {
    const currentUser = useCurrentUser();
    const sectionPortal = document.getElementById('section-cancel-portal');

    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const handleSetPinNumber = (number: string) => {
        if (pin.length === 5) return;

        setPin(prevState => {
            return [...prevState, number];
        });
    };

    const handleBackSpace = () => {
        if (pin.length === 0) return;

        setPin(prevState => {
            const updatedPin = [...prevState];
            updatedPin.pop();
            return updatedPin;
        });
    };

    const handleForgotPin = () => {
        // TODO: trigger email with link to reset pin
        // ? How do we handle users with no emails?
        // ? An sms message?
        handleCloseModal();
        newModal(
            <ForgotPinConfirmation />,
            {
                sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
            },
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    let title = 'Create Your Pin';
    let subText = `for ${currentUser?.name}`;
    let actionButtonText = 'Set PIN';
    let showForgotPin = false;

    if (viewMode === FamilyPinViewModeEnum.verify) {
        title = 'Verify PIN';
        subText = 'Please re-enter your PIN to confirm.';
        actionButtonText = isVerifying ? 'Verifying...' : 'Verify PIN';
    } else if (viewMode === FamilyPinViewModeEnum.edit && !skipVerification) {
        title = 'Enter PIN';
        subText = 'Please enter your current PIN to proceed';
        actionButtonText = isVerifying ? 'Verifying...' : 'Verify PIN';
        showForgotPin = true;
    } else if (
        (viewMode === FamilyPinViewModeEnum.create && !skipVerification) ||
        (viewMode === FamilyPinViewModeEnum.create && skipVerification)
    ) {
        title = 'Update Your Pin';

        if (titleOverride) title = titleOverride;
    }

    const isDisabled = pin?.length !== 5 || isVerifying;

    const actionButton = (
        <IonRow className="flex w-full items-center justify-center">
            <IonCol className="mt-4 flex w-full max-w-[600px] items-center justify-center p-0">
                <button
                    disabled={isDisabled}
                    onClick={handleOnClick}
                    className={`text-white w-full flex flex-1 items-center justify-center py-2 text-lg font-notoSans  rounded-[20px] ${
                        isDisabled ? 'bg-[#18224E80]' : 'bg-grayscale-900'
                    }`}
                >
                    {actionButtonText}
                </button>
            </IonCol>
        </IonRow>
    );

    const buttons = (
        <>
            {actionButton}

            <IonRow className="flex w-full items-center justify-center">
                <IonCol className="flex w-full max-w-[600px] items-center justify-center p-0 mb-[-20px] mt-3">
                    <button
                        onClick={handleCloseModal}
                        className="text-grayscale-900 bg-white w-full flex flex-1 items-center justify-center py-2 text-lg font-notoSans h-full rounded-[20px] mb-[40px]"
                    >
                        {closeButtonText || 'Close'}
                    </button>
                </IonCol>
            </IonRow>
        </>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-end ">
            <div className="w-full max-w-[400px]">
                <div className="pt-6 bg-white rounded-[20px] w-full">
                    <div className="w-full flex flex-col justify-center items-center">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[64px] w-[64px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[64px] min-h-[64px]"
                            customImageClass="flex justify-center items-center h-[64px] w-[64px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[64px] min-h-[64px]"
                            customSize={120}
                        />
                        <h4 className="text-grayscale-900 text-[24px] xs:text-lg font-normal font-poppins mt-2">
                            {title}
                        </h4>
                        <p className="text-grayscale-900 text-sm font-poppins">{subText}</p>
                    </div>

                    <div className="flex items-center justify-center w-full mt-4 xs:mt-3">
                        {Array(5)
                            .fill(undefined)
                            .map((_, index) => {
                                const pinNumber = pin?.[index];
                                const showBorder = !pinNumber;

                                return (
                                    <div
                                        key={index}
                                        className={`w-[24px] text-grayscale-900 h-[24px] mr-2 flex items-center justify-center ${
                                            showBorder
                                                ? 'border-grayscale-900 border-solid border-b-2'
                                                : ''
                                        } ${
                                            errors?.pin || errors?.confirmPin
                                                ? 'border-red-600'
                                                : ''
                                        }`}
                                    >
                                        <span className="font-poppins text-2xl">{pinNumber}</span>
                                    </div>
                                );
                            })}
                    </div>

                    {errors?.pin && (
                        <div className="w-full flex items-center justify-center p-0 m-0 mt-4">
                            <p className="p-0 m-0 text-center text-red-600 font-poppins">
                                {errors?.pin}
                            </p>
                        </div>
                    )}

                    {errors?.confirmPin && (
                        <div className="w-full flex items-center justify-center p-0 m-0 mt-4">
                            <p className="p-0 m-0 text-center text-red-600 font-poppins">
                                {errors?.confirmPin}
                            </p>
                        </div>
                    )}

                    <section className="w-full flex flex-wrap items-center justify-center mt-6 xs:mt-6">
                        <div className="w-full max-w-[300px] flex flex-wrap items-center justify-center relative">
                            {pinNumbersAllowed?.map((number, i) => {
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setErrors({});
                                            handleSetPinNumber(number);
                                        }}
                                        className="text-grayscale-900 flex items-center justify-center h-[70px] w-[70px] rounded-full bg-grayscale-100 mx-2 mb-3 text-[20px] border-solid border-[1px] border-grayscale-200 font-poppins focus:border-lightBlue-500 focus:bg-lightBlue-50 xs:h-[60px] xs:w-[60px] pin-number-btn"
                                    >
                                        {number}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => {
                                    setErrors({});
                                    handleBackSpace();
                                }}
                                className="absolute bottom-[-3px] right-[19px] flex items-center justify-center h-[70px] w-[70px] rounded-full bg-grayscale-100 mx-2 mb-4 text-[36px] border-solid border-[1px] border-grayscale-200 font-poppins focus:border-lightBlue-500 focus:bg-lightBlue-50 xs:h-[65px] xs:w-[65px] xs:right-[32px] pin-number-btn"
                            >
                                <Backspace className="text-grayscale-900 mr-1 w-[50px] h-[25px]" />
                            </button>
                        </div>
                    </section>

                    {showForgotPin && (
                        <div className="w-full flex items-center justify-center ion-padding-bottom">
                            <button
                                onClick={handleForgotPin}
                                className="text-lightBlue-500 font-poppins text-[17px] font-semibold forgot-pin-btn mb-[-5px]"
                            >
                                Forgot Pin
                            </button>
                        </div>
                    )}
                </div>
                {sectionPortal ? createPortal(buttons, sectionPortal) : buttons}
            </div>
        </div>
    );
};

export default FamilyPinModal;
