import React, { useState } from 'react';
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
    it('keeps a nonnumeric legacy result editable when Percent is selected', () => {
        const onChangeTemplate = vi.fn();
        const Harness = () => {
            const [template, setTemplate] = useState(legacyPercentTemplate);

            return (
                <ResultFieldEditor
                    template={template}
                    onChangeTemplate={next => {
                        onChangeTemplate(next);
                        setTemplate(next);
                    }}
                    canMakeDynamic={false}
                />
            );
        };

        render(<Harness />);
        expect(readResultState(legacyPercentTemplate()).isLegacyUntyped).toBe(true);

        fireEvent.click(screen.getByRole('button', { name: 'Percent' }));

        const resultInput = screen.getByPlaceholderText('e.g. 95');
        expect(resultInput).toHaveValue('B+');
        expect(screen.getByRole('alert')).toHaveTextContent('Enter a numeric result.');

        fireEvent.change(resultInput, { target: { value: '95' } });

        expect(resultInput).toHaveValue('95');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(readResultState(onChangeTemplate.mock.calls.at(-1)?.[0])).toMatchObject({
            resultType: 'Percent',
            value: '95',
            isLegacyUntyped: false,
        });
    });
});
