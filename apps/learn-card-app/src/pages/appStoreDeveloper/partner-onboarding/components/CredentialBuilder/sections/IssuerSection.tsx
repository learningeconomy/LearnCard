/**
 * IssuerSection - Issuer information (DID only - injected by system)
 */

import React from 'react';
import { Building2 } from 'lucide-react';

import { systemField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface IssuerSectionProps {
    isExpanded: boolean;
    onToggle: () => void;
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
                    <strong>Note:</strong> The issuer is automatically set to your wallet's DID. 
                    Recipients can verify the credential was issued by you through this identifier.
                </p>
            </div>
        </CollapsibleSection>
    );
};

export default IssuerSection;
