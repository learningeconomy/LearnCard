import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import {
    clrMilitaryComprehensiveRecord,
    clrMixedCareerRecord,
} from '@learncard/credential-library';
import {
    normalizeClrTranscriptDisplayModel,
    ClrTranscriptSurface,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { setLocale } from '../../paraglide/runtime.js';
import { ClrRenderer } from './ClrRenderer';
import ClrTranscriptFullPage from '../clr-transcript/surfaces/ClrTranscriptFullPage';
import ClrTranscriptCard from '../clr-transcript/surfaces/ClrTranscriptCard';
import ClrTranscriptEmbedWidget from '../clr-transcript/surfaces/ClrTranscriptEmbedWidget';

const mocks = vi.hoisted(() => ({ open: vi.fn(), close: vi.fn(), modal: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useModal: () => {
        mocks.modal();
        return { newModal: mocks.open, closeModal: mocks.close };
    },
    ModalTypes: { Right: 'right' },
    CredentialCategoryEnum: { learningHistory: 'learningHistory' },
    isSkillCompetencyAlignment: () => false,
    SkillCompetencyCard: () => null,
}));
vi.mock('../boost/boost-options-menu/ShareBoostLink', () => ({
    default: () => <button>Share record</button>,
}));
vi.mock('../clr-transcript/ClrTranscriptDetailModal', () => ({
    default: () => <div>Full record</div>,
}));
vi.mock('../clr-transcript/views/AcademicClrFullPage', () => ({
    default: () => <div>Academic full view</div>,
}));
vi.mock('../clr-transcript/views/AcademicClrCard', () => ({
    default: ({ onViewDetails }: { onViewDetails: () => void }) => (
        <button onClick={onViewDetails}>Academic card view</button>
    ),
}));
vi.mock('../clr-transcript/views/AcademicClrEmbed', () => ({
    default: () => <div>Academic embed view</div>,
}));
vi.mock('../clr-transcript/ClrCourseDetailPanel', () => ({ default: () => null }));
vi.mock('../clr-transcript/ClrProgramDetailPanel', () => ({ default: () => null }));
vi.mock('../clr-transcript/ClrAssessmentDetailPanel', () => ({ default: () => null }));
vi.mock('../clr-transcript/ClrCompetencyDetailPanel', () => ({ default: () => null }));
vi.mock('../clr-transcript/ClrTranscriptEvidenceList', () => ({
    default: ({ evidence }: { evidence: { name?: { value: string } }[] }) => (
        <div>
            {evidence.map((item, i) => (
                <p key={i}>{item.name?.value}</p>
            ))}
        </div>
    ),
}));

const fixture = clrMilitaryComprehensiveRecord.credential as VC;
const model = normalizeClrTranscriptDisplayModel(fixture as unknown as Record<string, unknown>);
const options = { viewer: 'student', surface: ClrTranscriptSurface.Full } as const;

beforeEach(() => {
    mocks.open.mockClear();
    mocks.close.mockClear();
    mocks.modal.mockReset();
    setLocale('en', { reload: false });
});

describe('shared CLR renderer', () => {
    it('shows every military child in its section and opens source-backed details', () => {
        const view = render(<ClrRenderer model={model} boost={fixture} options={options} />);
        for (const heading of [
            'Training',
            'Roles and fieldwork',
            'Assessments',
            'Competencies',
            'Qualifications',
            'Awards',
        ])
            expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
        expect(view.container.querySelectorAll('[data-clr-record-id]')).toHaveLength(
            model.records.length
        );
        for (const record of model.records) {
            fireEvent.click(screen.getByRole('button', { name: record.name!.value }));
            const panel = render(mocks.open.mock.lastCall![0]);
            expect(
                within(panel.container).getByRole('heading', { name: record.name!.value })
            ).toBeInTheDocument();
            expect(
                within(panel.container).getAllByText(record.provenance.issuer!.name!.value).length
            ).toBeGreaterThan(0);
            panel.unmount();
        }
        expect(screen.getByText('Published by')).toBeInTheDocument();
        expect(
            screen.queryByText(/GPA|Academic Record|Partial transcript/)
        ).not.toBeInTheDocument();
    });
    it('promotes fieldwork roles, rubric results and qualification identifiers without inventing verification', () => {
        render(<ClrRenderer model={model} options={options} />);
        fireEvent.click(screen.getByRole('button', { name: 'Supervised Logistics Exercise' }));
        const activity = render(mocks.open.mock.lastCall![0]);
        const detail = within(activity.container);
        expect(detail.getByText('Exercise Team Coordinator').closest('details')).toBeNull();
        expect(
            detail
                .getByText(
                    'Coordinated a fictional warehouse handover and explained decisions during debrief.'
                )
                .closest('details')
        ).toBeNull();
        expect(detail.getAllByText('Mentoring').length).toBeGreaterThan(0);
        activity.unmount();
        fireEvent.click(screen.getByRole('button', { name: 'Simulated logistics qualification' }));
        const qualification = render(mocks.open.mock.lastCall![0]);
        expect(
            within(qualification.container).getByText('SYN-LOG-2048').closest('details')
        ).toBeNull();
        expect(
            within(qualification.container).getByText('SYN-QUAL-48').closest('details')
        ).toBeNull();
        expect(within(qualification.container).getByText('Awarded')).toBeInTheDocument();
        expect(within(qualification.container).getByText('Valid from')).toBeInTheDocument();
        expect(within(qualification.container).getByText('Valid until')).toBeInTheDocument();
        expect(screen.getByText('Unsigned credential')).toBeInTheDocument();
        expect(screen.getByText('Required value: 70')).toBeInTheDocument();
    });
    it('uses neutral sections for a mixed-career collection', () => {
        const general = normalizeClrTranscriptDisplayModel(
            clrMixedCareerRecord.credential as Record<string, unknown>
        );
        const view = render(<ClrRenderer model={general} options={options} />);
        expect(view.container.querySelector('[data-clr-layout="general"]')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Other records' })).toBeInTheDocument();
        expect(view.container.querySelectorAll('[data-clr-record-id]')).toHaveLength(
            general.records.length
        );
    });
    it.each([ClrTranscriptSurface.Full, ClrTranscriptSurface.Card, ClrTranscriptSurface.Embed])(
        'uses the same layout on %s',
        surface => {
            const props = { model, boost: fixture, options: { ...options, surface } };
            const view = render(
                surface === 'full' ? (
                    <ClrTranscriptFullPage {...props} />
                ) : surface === 'card' ? (
                    <ClrTranscriptCard {...props} />
                ) : (
                    <ClrTranscriptEmbedWidget {...props} />
                )
            );
            expect(
                view.container.querySelector('[data-clr-layout="military"]')
            ).toBeInTheDocument();
            if (surface === 'card') {
                fireEvent.click(screen.getByRole('button', { name: 'View details' }));
                expect(mocks.open.mock.lastCall![0].props.model).toBe(model);
                expect(mocks.open.mock.lastCall![0].props.options.surface).toBe('full');
            } else {
                expect(
                    screen.queryByRole('button', { name: 'View details' })
                ).not.toBeInTheDocument();
            }
        }
    );
    it.each(['Joint Services Transcript', 'Army Training Record', 'CCAF Transcript'])(
        'selects military consistently across surfaces for %s',
        title => {
            const titledModel = normalizeClrTranscriptDisplayModel({ ...fixture, name: title });
            for (const surface of [
                ClrTranscriptSurface.Full,
                ClrTranscriptSurface.Card,
                ClrTranscriptSurface.Embed,
            ]) {
                const view = render(
                    <ClrRenderer model={titledModel} options={{ ...options, surface }} />
                );
                expect(
                    view.container.querySelector('[data-clr-layout="military"]')
                ).toBeInTheDocument();
                view.unmount();
            }
        }
    );
    it('keeps general embeds free of modal detail actions', () => {
        const general = normalizeClrTranscriptDisplayModel(
            clrMixedCareerRecord.credential as Record<string, unknown>
        );
        render(
            <ClrRenderer
                model={general}
                options={{ ...options, surface: ClrTranscriptSurface.Embed }}
            />
        );
        expect(screen.queryByRole('button', { name: 'View details' })).not.toBeInTheDocument();
        expect(mocks.open).not.toHaveBeenCalled();
    });
    it.each(['Academic Transcript', 'Joint Services Transcript', 'My learning record'])(
        'renders an embed without a modal provider for %s',
        name => {
            mocks.modal.mockImplementation(() => {
                throw new Error('Missing modal provider');
            });
            const embedded = normalizeClrTranscriptDisplayModel({ type: ['ClrCredential'], name });
            render(
                <ClrRenderer
                    model={embedded}
                    options={{ ...options, surface: ClrTranscriptSurface.Embed }}
                />
            );
            expect(mocks.modal).not.toHaveBeenCalled();
        }
    );
    it('honors caller-owned detail navigation', () => {
        const onViewDetails = vi.fn();
        render(
            <ClrRenderer
                model={model}
                options={{ ...options, surface: ClrTranscriptSurface.Card }}
                onViewDetails={onViewDetails}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'View details' }));
        expect(onViewDetails).toHaveBeenCalledOnce();
        expect(mocks.open).not.toHaveBeenCalled();
    });
    it('preserves viewer and sharing context when an academic card opens details', () => {
        const academic = normalizeClrTranscriptDisplayModel({
            type: ['ClrCredential'],
            name: 'Academic Transcript',
        });
        render(
            <ClrTranscriptCard
                model={academic}
                boost={fixture}
                boostUri="urn:shared-record"
                options={{ viewer: 'registrar', surface: ClrTranscriptSurface.Card }}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Academic card view' }));
        expect(mocks.open.mock.lastCall![0].props).toMatchObject({
            model: academic,
            boost: fixture,
            boostUri: 'urn:shared-record',
            options: { viewer: 'registrar', surface: ClrTranscriptSurface.Full },
        });
    });
    it.each([ClrTranscriptSurface.Full, ClrTranscriptSurface.Card, ClrTranscriptSurface.Embed])(
        'preserves the academic %s view',
        surface => {
            const academic = normalizeClrTranscriptDisplayModel({
                type: ['ClrCredential'],
                name: 'Academic Transcript',
            });
            render(<ClrRenderer model={academic} options={{ ...options, surface }} />);
            expect(screen.getByText(`Academic ${surface} view`)).toBeInTheDocument();
        }
    );
    it('localizes neutral labels and details after a locale switch', () => {
        const view = render(<ClrRenderer model={model} options={options} />);
        setLocale('es', { reload: false });
        view.rerender(<ClrRenderer model={model} options={options} />);
        expect(screen.getByRole('heading', { name: 'Cualificaciones' })).toBeInTheDocument();
        expect(screen.getByText('Publicado por')).toBeInTheDocument();
        setLocale('ar', { reload: false });
        view.rerender(<ClrRenderer model={model} options={options} />);
        expect(screen.getByRole('heading', { name: 'المؤهلات' })).toBeInTheDocument();
    });
    it('keeps duplicate and unknown children reachable and does not supply missing issuers', () => {
        const sparse = normalizeClrTranscriptDisplayModel({
            type: ['ClrCredential'],
            credentialSubject: {
                verifiableCredential: [1, 2].map(i => ({
                    id: 'duplicate',
                    credentialSubject: {
                        achievement: { achievementType: 'Unknown', name: `Unknown ${i}` },
                    },
                })),
            },
        });
        render(<ClrRenderer model={sparse} options={options} />);
        for (const record of sparse.records) {
            fireEvent.click(screen.getByRole('button', { name: record.name!.value }));
            expect(mocks.open.mock.lastCall![0].props.record.sourceCredentialId).toBe(record.id);
        }
        expect(screen.queryByText('Issued by')).not.toBeInTheDocument();
    });
});
