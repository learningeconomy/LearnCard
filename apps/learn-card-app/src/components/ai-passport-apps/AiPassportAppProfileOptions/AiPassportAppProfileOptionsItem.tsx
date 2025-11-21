import React from 'react';

import SlimCaretRight from '../../svgs/SlimCaretRight';
import AiPassportAppProfile from '../AiPassportAppProfile';
import AiPassportPersonalizationContainer from '../../ai-passport/AiPassportPersonalizationContainer';

import {
    LaunchPadAppListItem,
    ModalTypes,
    ProfilePicture,
    useCurrentUser,
    useModal,
} from 'learn-card-base';
import { AiAppProfileOption, AiAppProfileOptionsEnum } from './aiPassport-app-options.helpers';
import { useConsentFlowByUri } from 'apps/learn-card-app/src/pages/consentFlow/useConsentFlow';
import { useImmer } from 'use-immer';
import { ConsentFlowTerms } from '@learncard/types';
import useConsentFlow from 'apps/learn-card-app/src/pages/consentFlow/useConsentFlow';
import { getMinimumTermsForContract } from 'apps/learn-card-app/src/helpers/contract.helpers';
import ConsentFlowPrivacyAndData from 'apps/learn-card-app/src/pages/consentFlow/ConsentFlowPrivacyAndData';

export const AiPassportAppProfileOptionsItem: React.FC<{
    app: LaunchPadAppListItem;
    option: AiAppProfileOption;
    qaUri?: string;
}> = ({ app, option, qaUri }) => {
    const { newModal } = useModal();

    const currentUser = useCurrentUser();
    const {
        contract: contractDetails,
        openConsentFlowModal,
        consentedContractLoading,
        hasConsented,
    } = useConsentFlowByUri(app.contractUri, app);

    const [terms, setTerms] = useImmer(
        contractDetails?.contract
            ? getMinimumTermsForContract(contractDetails.contract, currentUser)
            : ({} as ConsentFlowTerms)
    );

    const { consentedContract } = useConsentFlow(contractDetails, app);

    const { Icon, type } = option;

    const personalizationIncomplete = !qaUri;

    const handleOnClick = async () => {
        // Commented out until supported
        // if (type === AiAppProfileOptionsEnum.learningInsights) {
        //     // TODO: support viewing insights
        // } else
        if (type === AiAppProfileOptionsEnum.personalization) {
            newModal(
                <AiPassportPersonalizationContainer />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
        } else if (type === AiAppProfileOptionsEnum.appProfile) {
            newModal(
                <AiPassportAppProfile app={app} />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
        } else if (type === AiAppProfileOptionsEnum.privacy) {
            newModal(
                <ConsentFlowPrivacyAndData
                    contractDetails={contractDetails}
                    app={app}
                    terms={hasConsented ? consentedContract?.terms : terms}
                    setTerms={setTerms}
                    isPostConsent={hasConsented}
                    termsUri={consentedContract?.uri}
                    headerClass="bg-white"
                />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
        }
    };

    return (
        <div
            onClick={handleOnClick}
            className="flex items-center justify-between w-full bg-white pb-[12px] pt-[12px] last:border-0 border-solid border-b-[1px] border-b-grayscale-200 cursor-pointer"
        >
            <div className="flex items-center justify-start">
                <div className="w-[45px] flex items-center justify-center mr-1">
                    {option?.Icon && type !== AiAppProfileOptionsEnum.personalization && (
                        <Icon className="text-grayscale-900" />
                    )}
                    {type === AiAppProfileOptionsEnum.personalization && (
                        <ProfilePicture
                            customContainerClass="text-grayscale-900 h-[35px] w-[35px] min-h-[35px] min-w-[35px] max-h-[35px] max-w-[35px] mt-[0px] mb-0"
                            customImageClass="w-full h-full object-cover"
                        />
                    )}
                    {type === AiAppProfileOptionsEnum.appProfile && (
                        <div className="h-[35px] w-[35px] min-h-[35px] min-w-[35px] max-h-[35px] max-w-[35px]">
                            <img
                                className="w-full h-full object-cover bg-white rounded-full overflow-hidden border-[1px] border-solid"
                                alt={`${app?.name} logo`}
                                src={app.img}
                            />
                        </div>
                    )}
                </div>
                <p className="text-grayscale-900 text-xl font-notoSans font-normal capitalize">
                    {option.title}
                </p>
            </div>

            <button className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                {type === AiAppProfileOptionsEnum.personalization && personalizationIncomplete && (
                    <div className="w-[10px] h-[10px] bg-rose-500  font-bold rounded-full z-50" />
                )}
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </button>
        </div>
    );
};

export default AiPassportAppProfileOptionsItem;
