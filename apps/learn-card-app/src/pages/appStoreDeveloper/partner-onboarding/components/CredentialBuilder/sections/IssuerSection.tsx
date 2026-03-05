/**
 * IssuerSection - Issuer DID (auto-injected) with profile-derived name/image/url
 */

import React from 'react';
import { Building2 } from 'lucide-react';

import { OBv3CredentialTemplate, systemField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface IssuerSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
}

export const IssuerSection: React.FC<IssuerSectionProps> = ({
    isExpanded,
    onToggle,
}) => {
    return (
        <CollapsibleSection
            title="Issuer"
            icon={<Building2 className="w-4 h-4 text-blue-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label="Issuer (DID)"
                field={systemField('Your organization\'s Decentralized Identifier (DID) from your LearnCard wallet')}
                onChange={() => {}}
                helpText="Automatically set to your wallet's DID when the credential is issued"
            />

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
                <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Issuer name, logo, and website are derived from your organization profile.
                    The issuer DID is automatically set to your wallet's DID at issuance.
                </p>
            </div>
        </CollapsibleSection>
    );
};

export default IssuerSection;
