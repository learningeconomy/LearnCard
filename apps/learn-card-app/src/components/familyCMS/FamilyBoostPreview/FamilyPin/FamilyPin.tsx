import React from 'react';
import FamilyPinButton from './FamilyPinButton';
import FamilyPinWrapper, { FamilyPinViewModeEnum } from './FamilyPinWrapper';

import { FamilyCMSState } from '../../familyCMSState';
import { ModalTypes, useModal } from 'learn-card-base';

export const FamilyPin: React.FC<{
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
    pinError?: string;
    setPinError: React.Dispatch<React.SetStateAction<string>>;
}> = ({ state, setState, pinError, setPinError }) => {
    const { newModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });
    const pinExists = (state?.pin || []).length > 0;

    const handleSetPin = (pin: string[]) => {
        setState(prevState => {
            return {
                ...prevState,
                pin: pin,
            };
        });
    };

    const presentPinModal = () => {
        newModal(
            <FamilyPinWrapper
                viewMode={pinExists ? FamilyPinViewModeEnum?.edit : FamilyPinViewModeEnum?.create}
                skipVerification
                titleOverride={!pinExists ? 'Create Your Pin' : ''}
                existingPin={state?.pin}
                handleOnSubmit={handleSetPin}
                familyName={state?.basicInfo?.name}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none mb-[-10px]',
                hideButton: true,
                usePortal: true,
                portalClassName: '!max-w-[400px] !mb-[-70px] h-[150px] ',
            },
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.Cancel }
        );
    };

    return (
        <>
            <section
                className={`bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px] ${
                    pinError?.length > 0 ? 'border-red-300 border-2' : ''
                }`}
            >
                <div className="w-full flex items-start justify-center flex-col">
                    <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                        Personal PIN
                    </h3>

                    {pinError?.length > 0 && (
                        <div className="text-red-400 font-medium mb-2 text-sm">{pinError}</div>
                    )}

                    <p className="text-grayscale-600 font-normal text-sm text-left mb-4">
                        Your pin allows you to access and manage controls that require your
                        authorization.
                    </p>

                    <FamilyPinButton
                        onClick={() => {
                            presentPinModal();
                            setPinError('');
                        }}
                        title={`${pinExists ? 'Edit Pin' : 'Set Pin'}`}
                        className="!border-0 !p-0 !m-0"
                        pinExists={pinExists}
                    />
                </div>
            </section>
        </>
    );
};

export default FamilyPin;
