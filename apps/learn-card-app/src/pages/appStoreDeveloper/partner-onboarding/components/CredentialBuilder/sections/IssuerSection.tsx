/**
 * IssuerSection - Shows the auto-injected DID (read-only) with explanatory note
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
    template,
    isExpanded,
    onToggle,
}) => {
    const issuer = template.issuer;

    return (
        <CollapsibleSection
            title="Issuer"
            icon={<Building2 className="w-4 h-4 text-blue-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label="Issuer (DID)"
                field={{ ...(issuer.id ?? systemField('issuer_did')), systemDescription: 'Your organization\'s Decentralized Identifier (DID) from your LearnCard wallet' }}
                onChange={() => {}}
                helpText="Your organization's Decentralized Identifier (DID) from your LearnCard wallet"
            />

            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <span className="font-semibold text-amber-700">Note:</span>{' '}
                    The issuer is automatically set to your wallet&apos;s DID. Recipients can verify the credential was issued by you through this identifier.
                </p>
            </div>
        </CollapsibleSection>
    );
};

export default IssuerSection;
