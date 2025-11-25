import React from 'react';
import { Updater } from 'use-immer';
import { LaunchPadAppListItem, ModalTypes, useModal } from 'learn-card-base';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

import { IonRippleEffect } from '@ionic/react';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ConsentFlowAiSessionsDetailsModal from './ConsentFlowAiSessionsDetailsModal';

type ConsentFlowAiSessionsReadItemProps = {
    aiSessionCategories: {
        [key: string]: {
            required: boolean;
            term: ConsentFlowTerms['read']['credentials']['categories'][string];
            setTerm: Updater<ConsentFlowTerms['read']['credentials']['categories'][string]>;
        };
    };
    contractDetails: ConsentFlowContractDetails;
    app?: LaunchPadAppListItem;
};

const ConsentFlowAiSessionsReadItem: React.FC<ConsentFlowAiSessionsReadItemProps> = ({
    aiSessionCategories,
    contractDetails,
    app,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    const totalCount = Object.values(aiSessionCategories).length;
    const numEnabled = Object.values(aiSessionCategories).filter(
        category => category.term.shareAll
    ).length;

    const someEnabled = numEnabled > 0;
    const allEnabled = numEnabled === totalCount;

    return (
        <li className="border-b border-solid border-grayscale-200 last:border-none text-black hover:bg-grayscale-100 transition-colors">
            <button
                type="button"
                onClick={() =>
                    newModal(
                        <ConsentFlowAiSessionsDetailsModal
                            aiSessionCategories={aiSessionCategories}
                            contractDetails={contractDetails}
                            app={app}
                        />
                    )
                }
                className="w-full h-full flex items-center gap-[10px] py-[15px] px-[10px] relative overflow-hidden ion-activatable"
            >
                <div
                    className={`flex items-center justify-center h-[40px] w-[40px] rounded-full shrink-0 bg-[#67E8F9]`}
                    role="presentation"
                >
                    <BlueMagicWand className={`h-[30px] w-[30px]`} />
                </div>

                <h4 className="text-[17px] text-grayscale-900 font-notoSans font-[600] leading-[24px] tracking-[0.25px] line-clamp-1 grow text-left">
                    AI Sessions
                </h4>

                <section className="flex items-center">
                    {someEnabled && (
                        <>
                            {allEnabled && (
                                <span className="text-emerald-700 font-notoSans text-[14px] font-[600]">
                                    Live Sync
                                </span>
                            )}
                            {!allEnabled && (
                                <span className="text-grayscale-600 font-notoSans text-[14px] font-[600]">
                                    {`${numEnabled}/${totalCount}`}
                                </span>
                            )}
                        </>
                    )}
                    {!someEnabled && (
                        <span className="text-grayscale-500 font-notoSans text-[14px] font-[600]">
                            Deny
                        </span>
                    )}

                    <SkinnyCaretRight className="h-[20px] w-[20px] text-grayscale-400" />
                </section>

                <IonRippleEffect />
            </button>
        </li>
    );
};

export default ConsentFlowAiSessionsReadItem;
