import React from 'react';
import { ConsentFlowTerms } from '@learncard/types';
import { Updater } from 'use-immer';
import { IonRippleEffect } from '@ionic/react';

import { useGetCredentialCount, CredentialCategory, ModalTypes, useModal } from 'learn-card-base';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ConsentFlowReadSharingStatus from './ConsentFlowReadSharingStatus';
import ConsentFlowReadSharingModal from './ConsentFlowReadSharingModal';
import { getInfoFromContractKey } from '../../helpers/contract.helpers';

type ConsentFlowReadSharingItemProps = {
    term: ConsentFlowTerms['read']['credentials']['categories'][string];
    setTerm?: Updater<ConsentFlowTerms['read']['credentials']['categories'][string]>;
    category: string;
    required?: boolean;
    contractOwnerDid?: string;
    onClickOverride?: () => void;
    hideIcon?: boolean;
    titleOverride?: string;
    infoText?: string;
};

const ConsentFlowReadSharingItem: React.FC<ConsentFlowReadSharingItemProps> = ({
    term,
    setTerm,
    category,
    required,
    contractOwnerDid,
    onClickOverride,
    hideIcon,
    titleOverride,
    infoText,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    const { IconComponent, iconSrc, title, iconClassName, iconCircleClass } =
        getInfoFromContractKey(category);

    const { data: count } = useGetCredentialCount(category as CredentialCategory);

    const totalCount = typeof count === 'number' ? count : '?';

    const disabled = required && term.sharing === true && term.shareAll === true;

    return (
        <li className="border-b border-solid border-grayscale-200 last:border-none text-black transition-colors">
            <button
                type="button"
                onClick={
                    onClickOverride
                        ? onClickOverride
                        : () =>
                              newModal(
                                  <ConsentFlowReadSharingModal
                                      term={term}
                                      setTerm={setTerm}
                                      category={category}
                                      required={required}
                                      contractOwnerDid={contractOwnerDid}
                                  />
                              )
                }
                className="w-full h-full flex items-center gap-[10px] py-[15px] px-[10px] relative overflow-hidden ion-activatable not:disabled:hover:bg-grayscale-100 disabled:pointer-events-none transition-colors"
                disabled={disabled}
            >
                {!hideIcon && (
                    <div
                        className={`flex items-center justify-center h-[40px] w-[40px] rounded-full shrink-0 ${iconCircleClass}`}
                        role="presentation"
                    >
                        {iconSrc ? (
                            <img src={iconSrc} className="h-[30px] w-[30px] text-white" />
                        ) : (
                            <IconComponent className={`h-[30px] ${iconClassName}`} />
                        )}
                    </div>
                )}
                {/* <section className="flex flex-col flex-1 items-start"> */}
                {/* <ConsentFlowReadSharingStatus term={term} /> */}

                <div className="flex flex-col flex-1 items-start">
                    <h4 className="text-[17px] text-grayscale-900 font-notoSans font-[600] leading-[24px] tracking-[0.25px] line-clamp-1 grow text-left">
                        {/* TODO pluralize for everything except Work History */}
                        {titleOverride ?? title}
                    </h4>
                    {/* </section> */}

                    {required && (
                        <span className="text-[14px] text-grayscale-600 text-left self-start">
                            Required
                        </span>
                    )}

                    {!required && infoText && (
                        <p className="text-grayscale-600 text-[14px] font-notoSans text-left">
                            {infoText}
                        </p>
                    )}
                </div>

                <section className="flex items-center">
                    {term.sharing && (
                        <>
                            {term.shareAll && (
                                <span className="text-emerald-700 font-notoSans text-[14px] font-[600]">
                                    Live Sync
                                </span>
                            )}
                            {!term.shareAll && (
                                <span className="text-grayscale-600 font-notoSans text-[14px] font-[600]">
                                    {`${term.shared?.length ?? 0}/${totalCount}`}
                                </span>
                            )}
                        </>
                    )}
                    {!term.sharing && (
                        <span className="text-grayscale-500 font-notoSans text-[14px] font-[600]">
                            Deny
                        </span>
                    )}

                    {!disabled && (
                        <SkinnyCaretRight className="h-[20px] w-[20px] text-grayscale-400" />
                    )}
                </section>

                {!required && <IonRippleEffect />}
            </button>
        </li>
    );
};

export default ConsentFlowReadSharingItem;
