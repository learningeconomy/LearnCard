/**
 * IssuerSection - Shows the auto-injected DID (read-only) with explanatory note
 */

import React from 'react';
import { Building2 } from 'lucide-react';

import * as m from '../../../../../../paraglide/messages.js';

import { OBv3CredentialTemplate, systemField } from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface IssuerSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
}

export const IssuerSection: React.FC<IssuerSectionProps> = ({ template, isExpanded, onToggle }) => {
    const issuer = template.issuer;

    return (
        <CollapsibleSection
            title={m['developerPortal.credentialBuilder.sectionTitles.issuer']()}
            icon={<Building2 className="w-4 h-4 text-blue-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
        >
            <FieldEditor
                label={m['developerPortal.credentialBuilder.issuer.did']()}
                field={{
                    ...(issuer.id ?? systemField('issuer_did')),
                    systemDescription: m['developerPortal.credentialBuilder.issuer.didHelp'](),
                }}
                onChange={() => {}}
                helpText={m['developerPortal.credentialBuilder.issuer.didHelp']()}
            />

            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p
                    className="text-sm text-blue-800"
                    dangerouslySetInnerHTML={{
                        __html: m['developerPortal.credentialBuilder.issuer.note'](),
                    }}
                />
            </div>
        </CollapsibleSection>
    );
};

export default IssuerSection;
