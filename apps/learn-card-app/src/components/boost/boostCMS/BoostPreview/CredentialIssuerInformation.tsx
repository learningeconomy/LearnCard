import React from 'react';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';

import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import { useGetVCInfo } from 'learn-card-base';
import { openExternalLink } from '../../../../helpers/externalLinkHelpers';

import { VC } from '@learncard/types';

type CredentialIssuerInformationProps = {
    credential: VC;
};

const CredentialIssuerInformation: React.FC<CredentialIssuerInformationProps> = ({
    credential,
}) => {
    const { issuerDid, issuerProfileImageElement } = useGetVCInfo(credential);

    const { data: knownDIDRegistry } = useKnownDIDRegistry(issuerDid);

    if (knownDIDRegistry?.source !== 'trusted') return null;

    const registryIssuerInfo = knownDIDRegistry?.results?.matchingIssuers?.[0]?.issuer;
    const {
        organization_name: name,
        location,
        homepage_uri: url,
    } = registryIssuerInfo?.federation_entity ?? {};
    const { ctid: credentialId, ce_url: credentialEngineUrl } =
        registryIssuerInfo?.credential_registry_entity ?? {};
    const { rorid: researchOrganizationRegistryId, ror_url: researchOrganizationRegistryUrl } =
        registryIssuerInfo?.ror_entity ?? {};

    return (
        <div className="p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4">
            <h3 className="text-[17px] font-poppins text-grayscale-900">Issuer Information</h3>
            <div className="flex flex-col gap-[10px] py-[10px] border-b-[1px] border-solid border-grayscale-200">
                <CredentialVerificationDisplay
                    credential={credential}
                    iconClassName="!w-[20px] !h-[20px] mr-1"
                    showText
                    className="!capitalize text-[14px] font-poppins font-[500]"
                />
                <p className="text-[14px] font-poppins text-grayscale-700">
                    A trusted verifier is an organization that has been officially vetted by a
                    community of peers to reliably confirm that a person's skills, experiences, and
                    credentials are authentic.{' '}
                    <button
                        onClick={() =>
                            openExternalLink(
                                'https://docs.learncard.com/core-concepts/identities-and-keys/trust-registries'
                            )
                        }
                        className="text-indigo-500 font-poppins text-[14px] font-[600] underline"
                    >
                        Learn More
                    </button>
                </p>
            </div>

            <div className="py-[10px] flex gap-[10px]">
                {issuerProfileImageElement}
                <div className="flex flex-col gap-[10px]">
                    <div className="flex flex-col">
                        <h4 className="text-[17px] font-poppins text-grayscale-900">{name}</h4>
                        {location && (
                            <p className="text-[14px] font-poppins text-grayscale-700">
                                {location}
                            </p>
                        )}
                    </div>
                    {url && (
                        <button
                            onClick={() => openExternalLink(url)}
                            className="text-indigo-500 font-poppins text-[14px] underline line-clamp-1"
                        >
                            {url}
                        </button>
                    )}
                </div>
            </div>

            {credentialId && (
                <div className="flex flex-col gap-[5px] py-[10px] border-b-[1px] border-solid border-grayscale-200 last:border-b-0 w-full">
                    <p className="text-[11px] font-poppins text-grayscale-600 uppercase font-[500]">
                        Credential ID
                    </p>
                    <p className="text-[14px] font-poppins text-grayscale-900">{credentialId}</p>
                </div>
            )}

            {credentialEngineUrl && (
                <div className="flex flex-col gap-[5px] py-[10px] border-b-[1px] border-solid border-grayscale-200 last:border-b-0 w-full">
                    <p className="text-[11px] font-poppins text-grayscale-600 uppercase font-[500]">
                        Credential Engine URL
                    </p>
                    <button
                        onClick={() => openExternalLink(credentialEngineUrl)}
                        className="text-[14px] font-poppins text-indigo-500 underline"
                    >
                        {credentialEngineUrl}
                    </button>
                </div>
            )}

            {researchOrganizationRegistryId && (
                <div className="flex flex-col gap-[5px] py-[10px] border-b-[1px] border-solid border-grayscale-200 last:border-b-0 w-full">
                    <p className="text-[11px] font-poppins text-grayscale-600 uppercase font-[500]">
                        Research Organization Registry ID
                    </p>
                    <p className="text-[14px] font-poppins text-grayscale-900">
                        {researchOrganizationRegistryId}
                    </p>
                </div>
            )}

            {researchOrganizationRegistryUrl && (
                <div className="flex flex-col gap-[5px] py-[10px] border-b-[1px] border-solid border-grayscale-200 last:border-b-0 w-full">
                    <p className="text-[11px] font-poppins text-grayscale-600 uppercase font-[500]">
                        Research Organization Registry URL
                    </p>
                    <a
                        href={researchOrganizationRegistryUrl}
                        className="text-[14px] font-poppins text-indigo-500 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {researchOrganizationRegistryUrl}
                    </a>
                </div>
            )}
        </div>
    );
};

export default CredentialIssuerInformation;
