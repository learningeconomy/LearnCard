import React from 'react';

import HumanReadableContractTerms from './HumanReadableContractTerms';

import { openExternalLink } from '../../helpers/externalLinkHelpers';
import { LaunchPadAppListItem } from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';
import { isSupportedPersonalField } from '../../helpers/contract.helpers';
import { isRegExp } from 'lodash-es';

import useTheme from '../../theme/hooks/useTheme';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import * as m from '../../paraglide/messages.js';

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
    const brandingConfig = useBrandingConfig();

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
            <div className="text-grayscale-600 text-sm leading-relaxed">
                <span className="font-poppins font-medium">{name}</span>
                {isRequestingAccess && (
                    <>
                        <span className="font-poppins">
                            {' '}
                            {isPostConsent
                                ? m['consentFlow.terms.requestedAccessTo']()
                                : m['consentFlow.terms.requestingAccessTo']()}{' '}
                        </span>
                        <HumanReadableContractTerms contractDetails={contractDetails} />
                    </>
                )}
                {!isRequestingAccess && (
                    <span className="font-poppins">
                        {' '}
                        {m['consentFlow.terms.notRequesting']({
                            brand: brandingConfig?.name ?? '',
                        })}
                    </span>
                )}
            </div>

            {contractDetails.reasonForAccessing && (
                <div className="text-grayscale-600 text-sm leading-relaxed font-poppins">
                    {contractDetails.reasonForAccessing}
                </div>
            )}

            {app?.privacyPolicyUrl && (
                <button
                    className={`w-fit font-poppins text-sm font-medium underline text-${primaryColor}`}
                    onClick={() => openExternalLink(app?.privacyPolicyUrl as string)}
                >
                    {m['consentFlow.terms.developerPrivacyPolicy']()}
                </button>
            )}
        </>
    );
};

export default ContractPermissionsAndDetailsText;
