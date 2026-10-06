import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { ClrRecordDetails } from './ClrRecordDetails';
import ClrCourseDetailPanel from './ClrCourseDetailPanel';
import ClrProgramDetailPanel from './ClrProgramDetailPanel';
import ClrAssessmentDetailPanel from './ClrAssessmentDetailPanel';
import ClrCompetencyDetailPanel from './ClrCompetencyDetailPanel';
import SparseAcademicRecordView from './views/SparseAcademicRecordView';
import StructuredTranscriptView from './views/StructuredTranscriptView';
import { clrMilitaryTrainingRecord } from '../../../../../packages/credential-library/src/fixtures/clr/military-training-record';
import type { VC } from '@learncard/types';

vi.mock('learn-card-base', () => ({
    useModal: () => ({ closeModal: vi.fn() }),
    CertificateDisplayIcon: () => null,
    SkillCompetencyCard: ({ name }: { name: string }) => <p>{name}</p>,
}));
vi.mock('./ClrTranscriptEvidenceList', () => ({ default: () => null }));
vi.mock('./ClrIssuerBadge', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    default: ({ credential }: { credential: VC }) => (
        <span data-testid="verified-credential">{credential.id}</span>
    ),
}));

const child = (achievementType = 'Course') => ({
    id: 'child-record',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'did:example:issuer', name: 'Issuing College' },
    awardedDate: '2026-05-10T12:00:00Z',
    validFrom: '2026-05-11T12:00:00Z',
    validUntil: '2028-05-11T12:00:00Z',
    credentialSubject: {
        id: 'did:example:learner',
        source: { id: 'did:example:assessor', name: 'Assessment Board' },
        activityStartDate: '2026-01-05T12:00:00Z',
        activityEndDate: '2026-04-30T12:00:00Z',
        role: 'Team lead',
        narrative: 'Coordinated a group project.',
        licenseNumber: 'LIC-42',
        identifier: [
            {
                identityType: 'studentId',
                identityHash: 'hashed-student',
                hashed: true,
                salt: 'private-salt',
            },
        ],
        achievement: {
            id: 'achievement-one',
            name: 'Applied learning',
            achievementType,
            description: 'A practical learning activity.',
            creator: { id: 'did:example:creator', name: 'Curriculum Institute' },
            criteria: {
                id: 'https://example.edu/criteria',
                narrative: 'Complete the practical project.',
            },
            fieldOfStudy: 'Engineering',
            specialization: 'Systems design',
            inLanguage: 'en',
            version: '2.1',
            tag: ['Practical', 'Teamwork'],
            otherIdentifier: [{ identifierType: 'catalogCode', identifier: 'ENG-42' }],
        },
    },
});

const transcript = (achievementType = 'Course') => ({
    id: 'outer-transcript',
    type: ['VerifiableCredential', 'ClrCredential'],
    issuer: { id: 'did:example:publisher', name: 'Transcript Publisher' },
    credentialSubject: { verifiableCredential: [child(achievementType)] },
});

const modelFor = (achievementType = 'Course') =>
    normalizeClrTranscriptDisplayModel(transcript(achievementType));

const expectRow = (label: string, value: string) => {
    const row = screen.getByText(label).parentElement;
    expect(row).toHaveTextContent(value);
};

describe('canonical CLR record details', () => {
    it('keeps issuer, assessor, creator and all five dates distinct', () => {
        const original = transcript();
        const before = JSON.stringify(original);
        const model = normalizeClrTranscriptDisplayModel(original);
        render(<ClrRecordDetails record={model.records[0]} />);
        expectRow('Issued by', 'Issuing College');
        expectRow('Assessed by', 'Assessment Board');
        expectRow('Achievement created by', 'Curriculum Institute');
        for (const [label, value] of [
            ['Activity started', '2026-01-05T12:00:00Z'],
            ['Activity ended', '2026-04-30T12:00:00Z'],
            ['Awarded', '2026-05-10T12:00:00Z'],
            ['Valid from', '2026-05-11T12:00:00Z'],
            ['Valid until', '2028-05-11T12:00:00Z'],
        ]) {
            expect(screen.getByText(label).parentElement?.querySelector('time')).toHaveAttribute(
                'datetime',
                value
            );
        }
        expect(screen.queryByText('Transcript Publisher')).not.toBeInTheDocument();
        expect(JSON.stringify(original)).toBe(before);
    });

    it('shows criteria and keeps supplementary metadata in an accessible disclosure', () => {
        render(<ClrRecordDetails record={modelFor().records[0]} />);
        expect(screen.getByText('Complete the practical project.')).toBeVisible();
        expect(screen.getByRole('link', { name: 'View criteria' })).toHaveAttribute(
            'href',
            'https://example.edu/criteria'
        );
        const summary = screen.getByText('Additional details');
        expect(summary.closest('details')).not.toHaveAttribute('open');
        fireEvent.click(summary);
        expect(summary.closest('details')).toHaveAttribute('open');
        expectRow('Specialization', 'Systems design');
        expectRow('Language', 'en');
        expectRow('Version', '2.1');
        expectRow('Role', 'Team lead');
        expectRow('Learner narrative', 'Coordinated a group project.');
        expectRow('License number', 'LIC-42');
        expectRow('catalogCode', 'ENG-42');
        expectRow('studentId (hashed)', 'hashed-student');
        expect(screen.getByText('Teamwork')).toBeInTheDocument();
        expect(screen.queryByText('private-salt')).not.toBeInTheDocument();
    });

    it('does not invent issuer or earned dates for definitions or validity-only records', () => {
        const model = normalizeClrTranscriptDisplayModel({
            type: ['ClrCredential'],
            issuer: { name: 'Transcript Publisher' },
            credentialSubject: {
                achievement: [
                    {
                        name: 'Course definition',
                        achievementType: 'Course',
                        criteria: { narrative: 'Required project' },
                    },
                ],
            },
        });
        const { rerender } = render(<ClrRecordDetails record={model.records[0]} />);
        expect(screen.getByText('Required project')).toBeInTheDocument();
        expect(screen.queryByText('Issued by')).not.toBeInTheDocument();
        expect(screen.queryByText('Awarded')).not.toBeInTheDocument();
        const record = modelFor().records[0];
        rerender(
            <ClrRecordDetails
                record={{ ...record, dates: { validFrom: record.dates.validFrom } }}
            />
        );
        expect(screen.getByText('Valid from')).toBeInTheDocument();
        expect(screen.queryByText('Awarded')).not.toBeInTheDocument();
        expect(screen.queryByText('Activity ended')).not.toBeInTheDocument();
    });

    it('omits empty sections and safely renders non-web references and markup', () => {
        const model = normalizeClrTranscriptDisplayModel({
            type: ['ClrCredential'],
            credentialSubject: { achievement: [{ name: 'Empty' }] },
        });
        const record = model.records[0];
        const { container, rerender } = render(<ClrRecordDetails record={record} />);
        expect(container).toBeEmptyDOMElement();
        const rich = modelFor().records[0];
        rerender(
            <ClrRecordDetails
                record={{
                    ...rich,
                    criteria: {
                        ...rich.criteria!,
                        id: { ...rich.criteria!.id!, value: 'javascript:alert(1)' },
                        narrative: {
                            ...rich.criteria!.narrative!,
                            value: '<img src=x onerror=alert(1)>',
                        },
                    },
                }}
            />
        );
        expect(screen.queryByRole('link', { name: 'View criteria' })).not.toBeInTheDocument();
        expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
        expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
        expect(container.querySelector('img')).toBeNull();
    });

    it('preserves named roles when the same organization performs more than one role', () => {
        const model = normalizeClrTranscriptDisplayModel(
            clrMilitaryTrainingRecord.credential as unknown as Record<string, unknown>
        );
        const record = model.records.find(record => record.provenance.assessor?.name);
        expect(record).toBeDefined();
        render(<ClrRecordDetails record={record} />);
        expectRow('Issued by', record!.provenance.issuer!.name!.value);
        expectRow('Assessed by', record!.provenance.assessor!.name!.value);
        expectRow('Achievement created by', record!.provenance.creator!.name!.value);
    });

    it.each(['Course', 'LearningProgram', 'Assessment'])(
        'integrates details and child verification into the %s panel',
        achievementType => {
            const model = modelFor(achievementType);
            const props = {
                model,
                boost: transcript(achievementType) as unknown as VC,
                issuerName: 'Transcript Publisher',
            };
            if (achievementType === 'Course')
                render(<ClrCourseDetailPanel {...props} course={model.courses[0]} />);
            else if (achievementType === 'LearningProgram')
                render(<ClrProgramDetailPanel {...props} program={model.programs[0]} />);
            else render(<ClrAssessmentDetailPanel {...props} assessment={model.assessments[0]} />);
            expectRow('Assessed by', 'Assessment Board');
            expect(screen.getByText('Complete the practical project.')).toBeInTheDocument();
            expect(screen.getByTestId('verified-credential')).toHaveTextContent('child-record');
            expect(screen.queryByText('Transcript Publisher')).not.toBeInTheDocument();
            expect(screen.queryByText(/Earned on|Completed on|Issued May/)).not.toBeInTheDocument();
        }
    );

    it('integrates competency details', () => {
        render(<ClrCompetencyDetailPanel model={modelFor('Competency')} />);
        expectRow('Assessed by', 'Assessment Board');
    });

    it.each(['Course', 'LearningProgram'])(
        'keeps the inline structured %s view consistent',
        achievementType => {
            render(<StructuredTranscriptView model={modelFor(achievementType)} />);
            expectRow('Assessed by', 'Assessment Board');
            expect(screen.getByText('Activity ended')).toBeInTheDocument();
            expect(screen.queryByText(/Earned:/)).not.toBeInTheDocument();
        }
    );

    it('selects the exact child when credentials reuse an identifier', () => {
        const first = child();
        const second = {
            ...child(),
            issuer: { id: 'did:example:second-issuer', name: 'Second College' },
        };
        const boost = {
            ...transcript(),
            credentialSubject: { verifiableCredential: [first, second] },
        };
        const model = normalizeClrTranscriptDisplayModel(boost);
        expect(model.records).toHaveLength(2);
        render(
            <ClrCourseDetailPanel
                model={model}
                boost={boost as unknown as VC}
                course={model.courses[1]}
            />
        );
        expectRow('Issued by', 'Second College');
        expect(screen.queryByText('Issuing College')).not.toBeInTheDocument();
    });

    it.each(['Award', 'Fieldwork', 'Assessment'])(
        'retains details for sparse %s records',
        achievementType => {
            render(<SparseAcademicRecordView model={modelFor(achievementType)} />);
            expectRow('Assessed by', 'Assessment Board');
            expect(screen.getByText('Activity started')).toBeInTheDocument();
        }
    );

    it('does not present a definition as a credential issued by the transcript publisher', () => {
        const boost = {
            type: ['ClrCredential'],
            issuer: { name: 'Transcript Publisher' },
            credentialSubject: {
                achievement: [
                    {
                        id: 'definition',
                        name: 'Defined course',
                        achievementType: 'Course',
                        criteria: { narrative: 'Course criteria' },
                    },
                ],
            },
        };
        const model = normalizeClrTranscriptDisplayModel(boost);
        render(
            <ClrCourseDetailPanel
                model={model}
                boost={boost as unknown as VC}
                course={model.courses[0]}
                issuerName="Transcript Publisher"
            />
        );
        expect(screen.getByText('Course criteria')).toBeInTheDocument();
        expect(screen.queryByText('1 Credential')).not.toBeInTheDocument();
        expect(screen.queryByTestId('verified-credential')).not.toBeInTheDocument();
    });
});
