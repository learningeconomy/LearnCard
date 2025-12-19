import React, { useState } from 'react';
import _ from 'lodash';

import FamilyPinModal from './FamilyPinModal';
import { confirmPinValidator, existingPinValidator, pinValidator } from './familyPin.helpers';
import { currentUserStore, switchedProfileStore, useModal, useVerifyPin } from 'learn-card-base';

export enum FamilyPinViewModeEnum {
    create = 'create',
    verify = 'verify',
    edit = 'edit',
}

type FamilyPinWrapperProps = {
    viewMode?: FamilyPinViewModeEnum;
    skipVerification?: boolean;
    existingPin?: string[];
    handleOnSubmit: (pin?: string[], newPin?: string[]) => void;
    familyName?: string;
    titleOverride?: string;
    closeButtonText?: string;
};

export const FamilyPinWrapper: React.FC<FamilyPinWrapperProps> = ({
    viewMode = FamilyPinViewModeEnum.create,
    skipVerification = false,
    existingPin,
    handleOnSubmit,
    familyName,
    titleOverride,
    closeButtonText,
}) => {
    const { closeModal } = useModal();

    const [pin, setPin] = useState<string[]>([]);
    const [confirmPin, setConfirmPin] = useState<string[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [_existingPin, _setExistingPin] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const hasParentSwitchedProfiles = switchedProfileStore?.use?.isSwitchedProfile();

    const [activeStep, setActiveStep] = useState<FamilyPinViewModeEnum>(
        skipVerification ? FamilyPinViewModeEnum.create : viewMode
    );

    const { mutateAsync: verifyPin } = useVerifyPin();

    const validate = (type: 'pin' | 'confirmPin' | 'existingPin', data: any): boolean => {
        let validator;

        switch (type) {
            case 'pin':
                validator = pinValidator;
                break;
            case 'confirmPin':
                validator = confirmPinValidator;
                break;
            case 'existingPin':
                validator = existingPinValidator;
                break;
            default:
                throw new Error('Invalid validation type');
        }

        const parsedData = validator.safeParse(data);

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const handleConfirmPin = async () => {
        if (activeStep === FamilyPinViewModeEnum.create) {
            if (validate('pin', { pin })) {
                setErrors({});
                setActiveStep(FamilyPinViewModeEnum.verify);
            }
        } else if (activeStep === FamilyPinViewModeEnum.edit && !skipVerification) {
            try {
                setIsVerifying(true);

                // handles switching verifying pin & switching back to parent account
                const parentDid = currentUserStore.get.parentUserDid();

                const isVerified = await verifyPin({
                    pin: _existingPin?.join(''),
                    did: hasParentSwitchedProfiles ? parentDid : undefined,
                });

                if (isVerified && hasParentSwitchedProfiles) {
                    handleOnSubmit?.();
                    return;
                }

                if (isVerified) {
                    setErrors({});
                    setActiveStep(FamilyPinViewModeEnum.create);
                }
            } catch (e) {
                console.warn('error', e);
                validate('existingPin', { pin: existingPin, confirmPin: _existingPin });
            } finally {
                setIsVerifying(false);
            }
        } else if (activeStep === FamilyPinViewModeEnum.verify) {
            if (!skipVerification && validate('confirmPin', { pin, confirmPin })) {
                setErrors({});
                handleOnSubmit?.(_existingPin.join(''), confirmPin?.join(''));
                closeModal();
            } else {
                if (validate('confirmPin', { pin, confirmPin })) {
                    setErrors({});
                    handleOnSubmit?.(confirmPin?.join(''));
                    closeModal();
                }
            }
        }
    };

    if (activeStep === FamilyPinViewModeEnum.verify) {
        return (
            <FamilyPinModal
                handleOnClick={handleConfirmPin}
                errors={errors}
                setErrors={setErrors}
                pin={confirmPin}
                setPin={setConfirmPin}
                handleCloseModal={closeModal}
                viewMode={activeStep}
                familyName={familyName}
                isVerifying={isVerifying}
                closeButtonText={closeButtonText}
            />
        );
    } else if (activeStep === FamilyPinViewModeEnum.edit) {
        return (
            <FamilyPinModal
                handleOnClick={handleConfirmPin}
                errors={errors}
                setErrors={setErrors}
                pin={_existingPin}
                setPin={_setExistingPin}
                handleCloseModal={closeModal}
                viewMode={activeStep}
                familyName={familyName}
                skipVerification={skipVerification}
                isVerifying={isVerifying}
                closeButtonText={closeButtonText}
            />
        );
    }

    return (
        <FamilyPinModal
            handleOnClick={handleConfirmPin}
            errors={errors}
            setErrors={setErrors}
            pin={pin}
            setPin={setPin}
            handleCloseModal={closeModal}
            viewMode={activeStep}
            familyName={familyName}
            skipVerification={skipVerification}
            titleOverride={titleOverride}
            isVerifying={isVerifying}
            closeButtonText={closeButtonText}
        />
    );
};

export default FamilyPinWrapper;
