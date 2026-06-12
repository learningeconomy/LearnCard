import React from 'react';
import { ConsentFlowTerm } from '@learncard/types';
import { IonRippleEffect } from '@ionic/react';

import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';

import { getInfoFromContractKey } from '../../helpers/contract.helpers';
import { VERIFIABLE_DATA_KEY_BY_CATEGORY } from './ConsentFlowVerifiableDataConstants';
import {
    SelfAssignedSkillsSummary,
    VerifiableDataSummary,
} from './ConsentFlowVerifiableDataSummary';

type VerifiableDataSharingMode = 'liveSync' | 'shareOnce' | 'deny';

type ConsentFlowVerifiableDataSharingItemProps = {
    term: ConsentFlowTerm;
    category: string;
    required?: boolean;
    titleOverride?: string;
    infoText?: string;
    onModeChange: (mode: VerifiableDataSharingMode) => void;
};

const ConsentFlowVerifiableDataSharingItem: React.FC<ConsentFlowVerifiableDataSharingItemProps> = ({
    term,
    category,
    required,
    titleOverride,
    infoText,
    onModeChange,
}) => {
    const { IconComponent, iconSrc, title, iconClassName, iconCircleClass } =
        getInfoFromContractKey(category);

    const isLiveSync = Boolean(term.sharing && term.shareAll);
    const isShareOnce = Boolean(term.sharing && !term.shareAll);

    const nextMode = (() => {
        if (isLiveSync) {
            return 'shareOnce' as const;
        }

        if (isShareOnce) {
            return required ? ('liveSync' as const) : ('deny' as const);
        }

        return 'liveSync' as const;
    })();

    const currentLabel = isLiveSync ? 'Live Sync' : isShareOnce ? 'Share Once' : 'Deny';

    const handleRowClick = () => {
        onModeChange(nextMode);
    };

    return (
        <li className="border-b border-solid border-grayscale-200 last:border-none text-black transition-colors">
            <button
                type="button"
                onClick={handleRowClick}
                className="w-full h-full flex flex-col gap-[10px] py-[15px] px-[10px] relative overflow-hidden ion-activatable not:disabled:hover:bg-grayscale-100 disabled:pointer-events-none transition-colors text-left"
            >
                <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-[10px] min-w-0 flex-1">
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

                        <div className="flex flex-col flex-1 items-start gap-1 min-w-0">
                            <h4 className="text-[17px] text-grayscale-900 font-notoSans font-[600] leading-[24px] tracking-[0.25px] line-clamp-1 grow text-left">
                                {titleOverride ?? title}
                            </h4>

                            {category === 'Self-Assigned Skills' ? (
                                <SelfAssignedSkillsSummary />
                            ) : (
                                <VerifiableDataSummary
                                    category={category}
                                    dataKey={VERIFIABLE_DATA_KEY_BY_CATEGORY[category] ?? category}
                                />
                            )}

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
                    </div>

                    <section className="flex items-center gap-1 shrink-0">
                        <span
                            className={`text-[14px] font-notoSans font-[600] shrink-0 ${
                                isLiveSync
                                    ? 'text-emerald-700'
                                    : isShareOnce
                                    ? 'text-grayscale-600'
                                    : 'text-grayscale-500'
                            }`}
                        >
                            {currentLabel}
                        </span>

                        <SkinnyCaretRight className="h-[20px] w-[20px] text-grayscale-400" />
                    </section>
                </div>

                <IonRippleEffect />
            </button>
        </li>
    );
};

export default ConsentFlowVerifiableDataSharingItem;
