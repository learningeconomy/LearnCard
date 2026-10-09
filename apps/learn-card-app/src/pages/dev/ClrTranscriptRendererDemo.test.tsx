import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import type {
    ClrTranscriptDisplayModel,
    ViewOptions,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { ClrRecordDetails } from '../../components/clr-transcript/ClrRecordDetails';
import ClrResultWithScaleList from '../../components/clr-transcript/ClrResultWithScaleList';
import ClrTranscriptRendererDemo from './ClrTranscriptRendererDemo';
import { clrAcademicProvenanceDemo } from './clrAcademicProvenance.fixture';
import { CLR_TRANSCRIPT_DEMO_FIXTURES } from './clrTranscriptDemo.fixtures';

const fullPage = vi.hoisted(() => vi.fn());

vi.mock('@ionic/react', () => ({
    IonPopover: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
        isOpen ? <div role="dialog">{children}</div> : null,
    IonList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonItem: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
        <button onClick={onClick}>{children}</button>
    ),
    IonLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('../../components/clr-transcript', () => ({
    ClrTranscriptFullPage: (props: { model: ClrTranscriptDisplayModel; options: ViewOptions }) => {
        fullPage(props);
        return <main>{props.model.header.title.value}</main>;
    },
    ClrTranscriptCard: () => <p>Card surface</p>,
    ClrTranscriptEmbedWidget: () => <p>Embed surface</p>,
}));

describe('academic CLR demo fixtures', () => {
    it('selects the four added academic fixtures and the synthetic fixture in the full transcript layout', () => {
        render(<ClrTranscriptRendererDemo />);
        for (const key of [
            'provisional',
            'multiAchievement',
            'demoIsd',
            'officialAcademic',
            'syntheticAcademic',
        ] as const) {
            const entry = CLR_TRANSCRIPT_DEMO_FIXTURES[key];
            const selection = screen.getByRole('button', {
                name: /Westbridge \(Full\)|Provisional Transcript|Multi-Achievement|Demo ISD|Official Academic Transcript|Synthetic Academic/,
            });
            fireEvent.click(selection);
            const picker = within(screen.getByRole('dialog'));
            expect(picker.getAllByRole('button')).toHaveLength(12);
            fireEvent.click(picker.getByRole('button', { name: entry.label }));
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: entry.label })).toBeInTheDocument();
            const props = fullPage.mock.lastCall![0];
            expect(props.boost).toBe(entry.credential);
            expect(props.model.records.length).toBeGreaterThan(0);
            expect(props.options.surface).toBe('full');
            expect(props.insetTop).toBe(false);
        }
        expect(screen.queryByText('Card surface')).not.toBeInTheDocument();
        expect(screen.queryByText('Embed surface')).not.toBeInTheDocument();
    });

    it('renders a rubric-only result and independent academic provenance without creating a score', () => {
        const before = JSON.stringify(clrAcademicProvenanceDemo);
        const model = normalizeClrTranscriptDisplayModel(clrAcademicProvenanceDemo);
        expect(model.courses).toHaveLength(1);
        const course = model.courses[0];
        expect(course.results[0].value).toBeUndefined();
        expect(course.results[0].achievedLevel?.name).toBe('Advanced');
        expect(course.results[0].requiredRubricLevel?.name).toBe('Proficient');
        const record = model.records[0];
        const ids = [
            model.canonical.collection.publisher?.id?.value,
            record.provenance.issuer?.id?.value,
            record.provenance.assessor?.id?.value,
            record.provenance.creator?.id?.value,
        ];
        expect(ids.every(Boolean)).toBe(true);
        expect(new Set(ids).size).toBe(4);
        expect(new Set(Object.values(record.dates).map(date => date?.value)).size).toBe(5);
        render(
            <>
                <ClrRecordDetails record={record} />
                <ClrResultWithScaleList results={course.results} />
            </>
        );
        expect(screen.getByText('Issued by').parentElement).toHaveTextContent(
            'Example College Registrar (Synthetic)'
        );
        expect(screen.getByText('Assessed by').parentElement).toHaveTextContent(
            'Academic Assessment Board (Synthetic)'
        );
        expect(screen.getByText('Achievement created by').parentElement).toHaveTextContent(
            'Curriculum Design Institute (Synthetic)'
        );
        expect(screen.getByRole('list', { name: 'Rubric scale' })).toHaveTextContent('Advanced');
        expect(screen.getByText('passing')).toBeInTheDocument();
        expect(
            screen.queryByText('Transcript Publishing Office (Synthetic)')
        ).not.toBeInTheDocument();
        expect(JSON.stringify(clrAcademicProvenanceDemo)).toBe(before);
        expect(model.canonical.collection.hasProof).toBe(false);
    });
});
