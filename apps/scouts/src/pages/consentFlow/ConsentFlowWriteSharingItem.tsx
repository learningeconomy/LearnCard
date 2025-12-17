import React from 'react';
import { ConsentFlowTerms } from '@learncard/types';
import { Updater } from 'use-immer';
import { IonRippleEffect } from '@ionic/react';

import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import { getInfoFromContractKey } from '../../helpers/contract.helpers';

type ConsentFlowWriteSharingItemProps = {
    term: ConsentFlowTerms['write']['credentials']['categories'][string];
    setTerm: Updater<ConsentFlowTerms['write']['credentials']['categories'][string]>;
    category: string;
    required?: boolean;
};

const ConsentFlowWriteSharingItem: React.FC<ConsentFlowWriteSharingItemProps> = ({
    term,
    setTerm,
    category,
    required,
}) => {
    const { IconComponent, title, iconClassName, iconCircleClass } =
        getInfoFromContractKey(category);

    return (
        <li
            key={category}
            className="border-b border-solid border-grayscale-300 last:border-none text-black hover:bg-grayscale-100 transition-colors"
        >
            <button
                type="button"
                onClick={() => setTerm(!term)}
                className="w-full h-full flex items-center gap-3 py-4 px-3 relative overflow-hidden ion-activatable"
            >
                <div
                    className={`flex items-center justify-center h-[40px] w-[40px] rounded-full ${iconCircleClass}`}
                    role="presentation"
                >
                    <IconComponent className={`h-[30px] ${iconClassName}`} />
                </div>
                <section className="flex flex-col flex-1 items-start">
                    <output
                        className={`text-sm font-semibold ${
                            term ? 'text-emerald-800' : 'text-grayscale-600'
                        }`}
                    >
                        {term ? 'Allow Access' : 'Deny Access'}
                    </output>

                    <h4 className="text-lg text-grayscale-900 font-poppins leading-none">
                        {title}
                    </h4>
                </section>

                <SkinnyCaretRight className="h-[20px] w-[20px] text-grayscale-500" />

                <IonRippleEffect />
            </button>
        </li>
    );
};

export default ConsentFlowWriteSharingItem;
