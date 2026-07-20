import React from 'react';

import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { ActivityField } from './credentialTypeCatalog';
import {
    getDescriptor,
    descriptorLabel,
    descriptorPlaceholder,
    descriptorOptionLabel,
} from './fieldDescriptors';
import { ResultFieldEditor } from './ResultFieldEditor';
import { TemplatableField } from './TemplatableField';
import * as m from '../../../paraglide/messages.js';

interface ActivityFieldsProps {
    fields: ActivityField[];
    template: OBv3CredentialTemplate;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
    canMakeDynamic: boolean;
}

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';

export const ActivityFields: React.FC<ActivityFieldsProps> = ({
    fields,
    template,
    onChangeTemplate,
    canMakeDynamic,
}) => {
    if (fields.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
            {fields.map(field => {
                if (field === 'score') {
                    return (
                        <ResultFieldEditor
                            key="score"
                            template={template}
                            onChangeTemplate={onChangeTemplate}
                            canMakeDynamic={canMakeDynamic}
                        />
                    );
                }

                const descriptor = getDescriptor(field);
                const value = descriptor.get(template);
                const onChange = (next: string) => onChangeTemplate(descriptor.set(template, next));

                if (
                    descriptor.setField &&
                    descriptor.getField &&
                    (descriptor.input === 'text' || descriptor.input === 'number')
                ) {
                    return (
                        <TemplatableField
                            key={field}
                            label={descriptorLabel(descriptor)}
                            field={descriptor.getField(template)}
                            variableName={field}
                            canMakeDynamic={canMakeDynamic}
                            variant={descriptor.input === 'number' ? 'number' : 'input'}
                            placeholder={descriptorPlaceholder(descriptor)}
                            onChange={next =>
                                onChangeTemplate(descriptor.setField!(template, next))
                            }
                        />
                    );
                }

                return (
                    <div key={field}>
                        <label className={LABEL_CLASS}>{descriptorLabel(descriptor)}</label>
                        {descriptor.input === 'select' ? (
                            <select
                                value={value}
                                onChange={e => onChange(e.target.value)}
                                className={INPUT_CLASS}
                            >
                                <option value="">
                                    {descriptorPlaceholder(descriptor) ??
                                        m['issueFlow.fields.selectDefault']()}
                                </option>
                                {(descriptor.options ?? []).map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {descriptorOptionLabel(descriptor, opt)}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={
                                    descriptor.input === 'date'
                                        ? 'date'
                                        : descriptor.input === 'number'
                                        ? 'number'
                                        : 'text'
                                }
                                inputMode={descriptor.input === 'number' ? 'decimal' : undefined}
                                value={value}
                                onChange={e => onChange(e.target.value)}
                                placeholder={descriptorPlaceholder(descriptor)}
                                className={INPUT_CLASS}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
