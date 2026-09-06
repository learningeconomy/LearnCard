import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
    staticField,
    systemField,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { ResultFieldEditor } from './ResultFieldEditor';
import { readResultState } from './resultField';

const legacyPercentTemplate = (): OBv3CredentialTemplate => ({
    schemaType: 'obv3',
    contexts: [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    types: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: staticField('Test'),
    issuer: { id: systemField('issuer_did'), name: staticField('Issuer') },
    credentialSubject: {
        id: systemField('recipient_did'),
        achievement: {
            name: staticField('Test Achievement'),
            description: staticField('A test'),
            achievementType: staticField('Course'),
        },
        result: [{ id: 'legacy-result', value: staticField('B+') }],
    },
    validFrom: systemField('issue_date'),
    customFields: [],
});

describe('ResultFieldEditor', () => {
    it('converts a legacy untyped result when its default Percent type is selected', () => {
        const template = legacyPercentTemplate();
        const onChangeTemplate = vi.fn();

        expect(readResultState(template).isLegacyUntyped).toBe(true);

        render(
            <ResultFieldEditor
                template={template}
                onChangeTemplate={onChangeTemplate}
                canMakeDynamic={false}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Percent' }));

        expect(onChangeTemplate).toHaveBeenCalledOnce();
        expect(readResultState(onChangeTemplate.mock.calls[0][0])).toMatchObject({
            resultType: 'Percent',
            isLegacyUntyped: false,
        });
    });
});
