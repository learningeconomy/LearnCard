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
    setTerm: Updater<ConsentFlowTerms['read']['credentials']['categories'][string]>;
    category: string;
    required?: boolean;
    contractOwnerDid: string;
};

const ConsentFlowReadSharingItem: React.FC<ConsentFlowReadSharingItemProps> = ({
    term,
    setTerm,
    category,
    required,
    contractOwnerDid,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const { IconComponent, title, iconClassName, iconCircleClass } =
        getInfoFromContractKey(category);

    const { data: count } = useGetCredentialCount(category as CredentialCategory);

    const totalCount = typeof count === 'number' ? count : '?';

    return (
        <li className="border-b border-solid border-grayscale-300 last:border-none text-black hover:bg-grayscale-100 transition-colors">
            <button
                type="button"
                onClick={() =>
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
                className="w-full h-full flex items-center gap-3 py-4 px-3 relative overflow-hidden ion-activatable"
            >
                <div
                    className={`flex items-center justify-center h-[40px] w-[40px] rounded-full ${iconCircleClass}`}
                    role="presentation"
                >
                    <IconComponent className={`h-[30px] ${iconClassName}`} />
                </div>
                <section className="flex flex-col flex-1 items-start">
                    <ConsentFlowReadSharingStatus term={term} />

                    <h4 className="text-lg text-grayscale-900 font-poppins leading-none">
                        {title}
                    </h4>
                </section>

                <section className="flex items-center">
                    {term.sharing && (
                        <span className="text-grayscale-600 font-poppins text-sm">
                            {term.shareAll
                                ? 'Sharing All'
                                : `${term.shared?.length ?? 0}/${totalCount}`}
                        </span>
                    )}

                    <SkinnyCaretRight className="h-[20px] w-[20px] text-grayscale-500" />
                </section>

                <IonRippleEffect />
            </button>
        </li>
    );
};

export default ConsentFlowReadSharingItem;
