import React, { useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { z } from 'zod';
import { IonCol, IonTextarea } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';
import { useModal, ModalTypes } from 'learn-card-base';
import BoostCMS from '../boostCMS/BoostCMS';
import { constructCustomBoostType, CUSTOM_BOOST_TYPE_REGEX } from 'learn-card-base';
import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
    BoostUserTypeEnum,
} from '../boost-options/boostOptions';

const MAX_TYPE_LENGTH = 100;
const StateValidator = z.object({
    customType: z
        .string()
        .min(3, 'Minimum 3 characters required')
        .max(MAX_TYPE_LENGTH, `Maximum ${MAX_TYPE_LENGTH} characters allowed`),
});

type ComponentProps = {
    handleCloseModal: () => void;
    category?: BoostCategoryOptionsEnum;
    useCMSModal?: boolean;
    parentUri?: string;
    overrideCustomize?: boolean;
};

const NewBoostSelectMenuCustomTypeButton: React.FC<ComponentProps> = ({
    handleCloseModal,
    category = BoostCategoryOptionsEnum.socialBadge,
    useCMSModal,
    parentUri,
    overrideCustomize,
}) => {
    const history = useHistory();
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const [customType, setCustomType] = React.useState('');
    const [validationError, setValidationError] = React.useState<string>();

    const { subTitle: title, color } = boostCategoryOptions[category];
    const charCount = customType.length;

    const validationResult = useMemo(() => StateValidator.safeParse({ customType }), [customType]);

    const isValid = useMemo(() => validationResult.success, [validationResult]);

    const handleInputChange = useCallback(
        (value: string) => {
            setCustomType(value.trimStart());
            if (!validationResult.success) {
                setValidationError(undefined);
            }
        },
        [validationResult]
    );

    const handleBoostCMSRedirect = useCallback(() => {
        if (!validationResult.success) {
            setValidationError(validationResult.error?.errors[0].message);
            return;
        }

        const _customType = constructCustomBoostType(category, customType);
        const queryParams = new URLSearchParams({
            boostUserType: BoostUserTypeEnum.someone,
            boostCategoryType: category,
            boostSubCategoryType: _customType,
            ...(parentUri && { parentUri }),
        });

        if (useCMSModal) {
            newModal(
                <BoostCMS
                    handleCloseModal={closeModal}
                    showCustomTypeInput={category === BoostCategoryOptionsEnum.socialBadge}
                    parentUri={parentUri}
                    overrideCustomize={overrideCustomize}
                    category={category}
                    boostUserType={BoostUserTypeEnum.someone}
                    achievementType={_customType}
                />
            );
        } else {
            handleCloseModal();
            history.push(`/boost?${queryParams}`);
        }

        setCustomType('');
    }, [validationResult, customType, parentUri, useCMSModal, category]);

    return (
        <IonCol
            size="6"
            size-sm="4"
            size-md="4"
            size-lg="4"
            className="flex justify-center items-center relative z-10 pt-5"
        >
            <div
                className={`h-full rounded-xl flex flex-col items-center justify-start gap-2.5 w-40 bg-${color} bg-opacity-100 mt-0 pt-0 min-h-[220px]`}
            >
                <div className="relative w-full flex items-center justify-center p-2 h-[72%]">
                    <IonTextarea
                        aria-label={`Create new ${title}`}
                        onIonInput={e => handleInputChange(e.detail.value?.trim() || '')}
                        placeholder={`New ${title}`}
                        className="bg-white rounded-lg px-2 h-full"
                        maxlength={MAX_TYPE_LENGTH}
                        autoGrow
                        rows={3}
                    />

                    <div className="absolute bottom-4 right-4 flex flex-col items-end z-[9]">
                        <span className="text-xs text-grayscale-800">
                            {charCount}/{MAX_TYPE_LENGTH}
                        </span>
                        {validationError && (
                            <span className="text-xs text-red-500 mt-1 ml-4">
                                {validationError}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleBoostCMSRedirect}
                    disabled={!isValid}
                    aria-disabled={!isValid}
                    className={`bg-white rounded-full p-2 w-fit h-fit shadow-sm transition-opacity ${
                        isValid ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ color: color }}
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>
        </IonCol>
    );
};

export default NewBoostSelectMenuCustomTypeButton;
