import React from 'react';

import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { ActivityField } from './credentialTypeCatalog';

interface ActivityFieldsProps {
    fields: ActivityField[];
    template: OBv3CredentialTemplate;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
}

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';

const dateValue = (iso?: string): string => (iso ? iso.slice(0, 10) : '');
const toIso = (date: string): string => (date ? new Date(date).toISOString() : '');

export const ActivityFields: React.FC<ActivityFieldsProps> = ({
    fields,
    template,
    onChangeTemplate,
}) => {
    if (fields.length === 0) return null;

    const subject = template.credentialSubject;
    const achievement = subject.achievement;

    const patchSubject = (patch: Partial<typeof subject>) =>
        onChangeTemplate({ ...template, credentialSubject: { ...subject, ...patch } });

    const patchAchievement = (patch: Partial<typeof achievement>) =>
        onChangeTemplate({
            ...template,
            credentialSubject: { ...subject, achievement: { ...achievement, ...patch } },
        });

    const setScore = (value: string) =>
        patchSubject({
            result: value ? [{ id: 'result_score', value: staticField(value) }] : undefined,
        });

    const setMemberId = (value: string) =>
        patchSubject({
            identifier: value
                ? [
                      {
                          id: 'member_id_entry',
                          identifier: staticField(value),
                          identifierType: staticField('memberId'),
                      },
                  ]
                : undefined,
        });

    const renderers: Record<ActivityField, React.ReactNode> = {
        completionDate: (
            <div key="completionDate">
                <label className={LABEL_CLASS}>Completion date</label>
                <input
                    type="date"
                    value={dateValue(subject.activityEndDate?.value)}
                    onChange={e =>
                        patchSubject({ activityEndDate: staticField(toIso(e.target.value)) })
                    }
                    className={INPUT_CLASS}
                />
            </div>
        ),
        startDate: (
            <div key="startDate">
                <label className={LABEL_CLASS}>Start date</label>
                <input
                    type="date"
                    value={dateValue(subject.activityStartDate?.value)}
                    onChange={e =>
                        patchSubject({ activityStartDate: staticField(toIso(e.target.value)) })
                    }
                    className={INPUT_CLASS}
                />
            </div>
        ),
        score: (
            <div key="score">
                <label className={LABEL_CLASS}>Score or result</label>
                <input
                    type="text"
                    value={subject.result?.[0]?.value?.value ?? ''}
                    onChange={e => setScore(e.target.value)}
                    placeholder="e.g. 95% or Pass"
                    className={INPUT_CLASS}
                />
            </div>
        ),
        creditsEarned: (
            <div key="creditsEarned">
                <label className={LABEL_CLASS}>Credits earned</label>
                <input
                    type="text"
                    value={subject.creditsEarned?.value ?? ''}
                    onChange={e => patchSubject({ creditsEarned: staticField(e.target.value) })}
                    placeholder="e.g. 3"
                    className={INPUT_CLASS}
                />
            </div>
        ),
        creditHours: (
            <div key="creditHours">
                <label className={LABEL_CLASS}>Duration / hours</label>
                <input
                    type="text"
                    value={achievement.creditsAvailable?.value ?? ''}
                    onChange={e =>
                        patchAchievement({ creditsAvailable: staticField(e.target.value) })
                    }
                    placeholder="e.g. 10 hours"
                    className={INPUT_CLASS}
                />
            </div>
        ),
        licenseNumber: (
            <div key="licenseNumber">
                <label className={LABEL_CLASS}>License number</label>
                <input
                    type="text"
                    value={subject.licenseNumber?.value ?? ''}
                    onChange={e => patchSubject({ licenseNumber: staticField(e.target.value) })}
                    placeholder="e.g. RN-1234567"
                    className={INPUT_CLASS}
                />
            </div>
        ),
        expiryDate: (
            <div key="expiryDate">
                <label className={LABEL_CLASS}>Expires on</label>
                <input
                    type="date"
                    value={dateValue(template.validUntil?.value)}
                    onChange={e =>
                        onChangeTemplate({
                            ...template,
                            validUntil: staticField(toIso(e.target.value)),
                        })
                    }
                    className={INPUT_CLASS}
                />
            </div>
        ),
        memberId: (
            <div key="memberId">
                <label className={LABEL_CLASS}>Member ID</label>
                <input
                    type="text"
                    value={subject.identifier?.[0]?.identifier?.value ?? ''}
                    onChange={e => setMemberId(e.target.value)}
                    placeholder="e.g. M-00482"
                    className={INPUT_CLASS}
                />
            </div>
        ),
        role: (
            <div key="role">
                <label className={LABEL_CLASS}>Role or level</label>
                <input
                    type="text"
                    value={subject.role?.value ?? ''}
                    onChange={e => patchSubject({ role: staticField(e.target.value) })}
                    placeholder="e.g. Gold Member"
                    className={INPUT_CLASS}
                />
            </div>
        ),
        term: (
            <div key="term">
                <label className={LABEL_CLASS}>Term</label>
                <input
                    type="text"
                    value={subject.term?.value ?? ''}
                    onChange={e => patchSubject({ term: staticField(e.target.value) })}
                    placeholder="e.g. Fall 2025"
                    className={INPUT_CLASS}
                />
            </div>
        ),
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
            {fields.map(field => renderers[field])}
        </div>
    );
};
