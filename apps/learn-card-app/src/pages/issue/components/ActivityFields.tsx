import React from 'react';

import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { ActivityField } from './credentialTypeCatalog';
import { getDescriptor } from './fieldDescriptors';
import { ResultFieldEditor } from './ResultFieldEditor';

interface ActivityFieldsProps {
    fields: ActivityField[];
    template: OBv3CredentialTemplate;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
}

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';

export const ActivityFields: React.FC<ActivityFieldsProps> = ({
    fields,
    template,
    onChangeTemplate,
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
                        />
                    );
                }

                const descriptor = getDescriptor(field);
                const value = descriptor.get(template);
                const onChange = (next: string) => onChangeTemplate(descriptor.set(template, next));

                return (
                    <div key={field}>
                        <label className={LABEL_CLASS}>{descriptor.label}</label>
                        {descriptor.input === 'select' ? (
                            <select
                                value={value}
                                onChange={e => onChange(e.target.value)}
                                className={INPUT_CLASS}
                            >
                                <option value="">{descriptor.placeholder ?? 'Select…'}</option>
                                {(descriptor.options ?? []).map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={descriptor.input === 'date' ? 'date' : 'text'}
                                value={value}
                                onChange={e => onChange(e.target.value)}
                                placeholder={descriptor.placeholder}
                                className={INPUT_CLASS}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
