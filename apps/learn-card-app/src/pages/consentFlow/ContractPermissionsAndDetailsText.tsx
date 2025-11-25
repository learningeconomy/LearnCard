import React from 'react';

import HumanReadableContractTerms from './HumanReadableContractTerms';

import { openExternalLink } from '../../helpers/externalLinkHelpers';
import { LaunchPadAppListItem } from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';
import { isSupportedPersonalField } from '../../helpers/contract.helpers';
import { isRegExp } from 'lodash';

import useTheme from '../../theme/hooks/useTheme';

type ContractPermissionsAndDetailsTextProps = {
    contractDetails: ConsentFlowContractDetails;
    app?: LaunchPadAppListItem;
    isPostConsent?: boolean;
};

const ContractPermissionsAndDetailsText: React.FC<ContractPermissionsAndDetailsTextProps> = ({
    contractDetails,
    app,
    isPostConsent,
}) => {
    const { name: contractName } = contractDetails ?? {};
    const { name: appName } = app ?? {};
    const name = appName ?? contractName;

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const isRequestingToRead =
        Object.keys(contractDetails.contract.read.credentials.categories ?? {}).length > 0;
    const isRequestingToWrite =
        Object.keys(contractDetails.contract.write.credentials.categories ?? {}).length > 0;
    const readPersonalFields = Object.keys(contractDetails.contract.read.personal)
        .filter(p => isSupportedPersonalField(p))
        .map(p => {
            if (p.toLowerCase() === 'image') return 'profile picture';
            return p.toLowerCase();
        });

    const isRequestingAccess =
        isRequestingToRead || isRequestingToWrite || readPersonalFields.length > 0;

    return (
        <>
            <div className="text-grayscale-900 text-[14px]">
                <span className="font-notoSans font-[600]">{name}</span>
                {isRequestingAccess && (
                    <>
                        <span className="font-notoSans">
                            {' '}
                            {isPostConsent ? 'has requested' : 'is requesting'} access to{' '}
                        </span>
                        <HumanReadableContractTerms contractDetails={contractDetails} />
                    </>
                )}
                {!isRequestingAccess && (
                    <span className="font-notoSans">
                        {' '}
                        is not requesting to read or write anything to your LearnCard
                    </span>
                )}
            </div>

            {contractDetails.reasonForAccessing && (
                <div className="text-grayscale-900 text-[14px] font-notoSans">
                    {contractDetails.reasonForAccessing}
                </div>
            )}

            {app?.privacyPolicyUrl && (
                <button
                    className={`w-fit font-notoSans text-[14px] font-[600] underline text-${primaryColor}`}
                    onClick={() => openExternalLink(app?.privacyPolicyUrl as string)}
                >
                    Developer's Privacy Policy
                </button>
            )}
        </>
    );
};

export default ContractPermissionsAndDetailsText;
