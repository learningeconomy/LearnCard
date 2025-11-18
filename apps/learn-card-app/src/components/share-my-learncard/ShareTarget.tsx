import React from 'react';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

import ConsentFlowSyncCard from '../../pages/consentFlow/ConsentFlowSyncCard';
import PostConsentFlowSyncCard from '../../pages/launchPad/PostConsentFlowSyncCard';
import ConsentFlowComingSoon from '../../pages/launchPad/ConsentFlowComingSoon';
import { ModalTypes, useContract, useModal } from 'learn-card-base';

type ShareTargetProps = {
    text: string;
    contractUri: string;
    icon: string;
    comingSoon?: boolean;
    onClick?: () => void;
};

const ShareTarget: React.FC<ShareTargetProps> = ({
    text,
    contractUri,
    icon,
    onClick,
    comingSoon = false,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    const { data: contract } = useContract(contractUri);
    const { data: consentedContracts } = useConsentedContracts();
    const consentedContract = consentedContracts?.find(c => c?.contract?.uri === contractUri);

    return (
        <li className="w-full text-black last:border-none border-b">
            <button
                onClick={() => {
                    onClick?.();

                    if (comingSoon) {
                        newModal(
                            <ConsentFlowComingSoon contract={contract} contractUri={contractUri} />,
                            { sectionClassName: '!max-w-[350px]' }
                        );
                    } else if (consentedContract) {
                        newModal(
                            <PostConsentFlowSyncCard
                                consentedContract={consentedContract}
                                showSyncNewData
                            />,
                            {
                                sectionClassName: '!max-w-[400px]',
                            }
                        );
                    } else {
                        newModal(
                            <ConsentFlowSyncCard
                                contractDetails={contract}
                                contractUri={contractUri}
                                showSyncNewData
                            />,
                            { sectionClassName: '!max-w-[400px] !bg-transparent !shadow-none' },
                            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                        );
                    }
                }}
                type="button"
                className="flex items-center gap-2 py-[10px] w-full"
            >
                <img src={icon} className="h-[35px] w-[35px]" />
                <span>{text}</span>
            </button>
        </li>
    );
};

export default ShareTarget;
