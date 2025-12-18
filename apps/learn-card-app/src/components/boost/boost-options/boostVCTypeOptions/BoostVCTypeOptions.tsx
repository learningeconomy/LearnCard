import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
    useModal,
    ModalTypes,
    Shapes,
    CredentialCategoryEnum,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import { IonRow, IonCol, IonGrid } from '@ionic/react';
import BoostVCTypeOptionButton from './BoostVCTypeOptionButton';
import CaretLeft from '../../../svgs/CaretLeft';
import { BoostUserTypeEnum } from '../boostOptions';
import BoostWizard from './BoostWizard';
import BoostWizardIcon from 'learn-card-base/svgs/BoostWizardIcon';
import { boostVCTypeOptions } from '../boostOptions';
import { createPortal } from 'react-dom';
import AiSessionsIcon from 'learn-card-base/svgs/wallet/AiSessionsIcon';
import BoostTemplateSelector from '../../boost-template/BoostTemplateSelector';
import BoostTemplateTypeModal from '../../boost-template/BoostTemplateTypeModal';

type BoostVCTypeOptionsProps = {
    boostUserType: BoostUserTypeEnum;
    otherUserProfileId?: string;
    boostCategoryType?: CredentialCategoryEnum;
    hideBackButton: boolean;
    showCloseButton: boolean;
    directToCMS?: boolean;
    directToNewTemplateType?: boolean;
    hideAiBoostWizard?: boolean;
};

export const BoostVCTypeOptions: React.FC<BoostVCTypeOptionsProps> = ({
    boostUserType = BoostUserTypeEnum.someone,
    otherUserProfileId = '',
    boostCategoryType,
    hideBackButton,
    showCloseButton,
    directToCMS, // Skip category subtype selection
    directToNewTemplateType,
    hideAiBoostWizard,
}) => {
    const history = useHistory();
    const { closeAllModals, closeModal, newModal } = useModal();
    const [selectedCategoryType, setSelectedCategoryType] = useState<
        BoostCategoryOptionsEnum | string | null
    >(boostCategoryType ?? null);

    const boostOptions = boostVCTypeOptions[boostUserType];
    const { Circle } = Shapes;
    const sectionPortal = document.getElementById('section-cancel-portal');

    const aiSessionsOption = {
        id: 0,
        title: 'AI Sessions',
        ShapeIcon: Circle,
        shapeColor: 'text-cyan-300 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',
        WalletIcon: AiSessionsIcon,
        type: null,
    };

    const boostOptionsItemList = boostOptions.map(
        ({ id, title, type, ShapeIcon, shapeColor, WalletIcon, iconStyles }) => {
            if (type === BoostCategoryOptionsEnum.all) {
                return <React.Fragment key={id}></React.Fragment>;
            }

            return (
                <BoostVCTypeOptionButton
                    key={id}
                    title={title}
                    categoryType={type}
                    setSelectedCategoryType={setSelectedCategoryType}
                    ShapeIcon={ShapeIcon}
                    shapeColor={shapeColor}
                    WalletIcon={WalletIcon}
                    iconStyles={iconStyles}
                    onClickOverride={
                        directToNewTemplateType
                            ? (categoryType: BoostCategoryOptionsEnum) => {
                                  closeModal();
                                  newModal(
                                      <BoostTemplateTypeModal
                                          selectedCategory={categoryType}
                                          otherUserProfileId={otherUserProfileId}
                                      />,
                                      {
                                          sectionClassName:
                                              '!max-w-[500px] !bg-transparent !shadow-none !overflow-visible',
                                      },
                                      { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                                  );
                              }
                            : undefined
                    }
                />
            );
        }
    );

    useEffect(() => {
        if (directToCMS && selectedCategoryType) {
            // Skip category subtype selection
            const baseLink = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${selectedCategoryType}`;
            let link = baseLink;
            if (otherUserProfileId) {
                link = `${baseLink}&otherUserProfileId=${otherUserProfileId}`;
            }

            closeAllModals();
            history.push(link);
        }
    }, [directToCMS, selectedCategoryType]);

    if (!directToCMS && selectedCategoryType) {
        return (
            <BoostTemplateSelector
                initialCategory={selectedCategoryType as BoostCategoryOptionsEnum}
                otherUserProfileId={otherUserProfileId}
            />
        );
    }

    return (
        <section>
            <IonRow className="flex flex-col pb-2">
                <IonCol className="w-full flex items-center justify-center">
                    <h6 className="flex items-center justify-center text-grayscale-900 font-semibold font-poppins text-[22px] tracking-wide">
                        {!hideBackButton && (
                            <button
                                className="text-grayscale-50 p-0 mr-[10px]"
                                onClick={closeAllModals}
                            >
                                <CaretLeft className="h-auto w-3 text-white" />
                            </button>
                        )}
                    </h6>
                </IonCol>
            </IonRow>

            <IonGrid>
                <IonRow className="w-full flex items-center justify-center">
                    <IonCol className="w-full flex flex-col items-center justify-center">
                        {boostOptionsItemList}
                    </IonCol>
                </IonRow>
            </IonGrid>
            {sectionPortal &&
                createPortal(
                    <div className="flex flex-col justify-center items-center relative max-w-[500px] !border-none">
                        {!hideAiBoostWizard && (
                            <button
                                onClick={() => {
                                    // closeAllModals();
                                    setTimeout(() => {
                                        newModal(
                                            <BoostWizard boostUserType={boostUserType} />,
                                            {
                                                sectionClassName: '!max-w-[500px] !bg-white',
                                            },
                                            {
                                                desktop: ModalTypes.Center,
                                                mobile: ModalTypes.FullScreen,
                                            }
                                        );
                                    }, 300);
                                }}
                                className="bg-cyan-100 text-grayscale-900 text-[17px] py-1.5 rounded-[20px] font-poppins font-semibold w-full h-[50px] flex justify-center items-center shadow-[0px_2px_3px_rgba(0,0,0,0.25)]"
                            >
                                <BoostWizardIcon className="w-[45px]" />
                                AI Boost Wizard
                            </button>
                        )}
                        <button
                            onClick={closeModal}
                            className="bg-white text-grayscale-800 text-[17px] font-poppins py-2.5 rounded-[30px] w-full h-full shadow-[0px_4px_4px_rgba(0,0,0,0.25)] mt-[10px]"
                        >
                            Close
                        </button>
                    </div>,
                    sectionPortal
                )}
        </section>
    );
};

export default BoostVCTypeOptions;
