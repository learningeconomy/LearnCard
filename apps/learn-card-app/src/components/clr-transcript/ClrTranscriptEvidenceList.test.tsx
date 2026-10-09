import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import ClrTranscriptEvidenceList from './ClrTranscriptEvidenceList';

const attachments = vi.hoisted(() => vi.fn());
vi.mock('../../pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts', () => ({
    default: (props: unknown) => {
        attachments(props);
        return <div>Attachments</div>;
    },
}));

it('renders narrative evidence directly and delegates only actual attachments to the opener', () => {
    const model = normalizeClrTranscriptDisplayModel({
        type: ['ClrCredential'],
        evidence: [
            { name: 'Observation', narrative: 'Demonstrated the checklist during the exercise.' },
            { id: 'https://example.org/evidence.pdf', name: 'Assessment sheet' },
        ],
    });
    render(<ClrTranscriptEvidenceList evidence={model.evidence} />);
    expect(screen.getByText('Demonstrated the checklist during the exercise.')).toBeInTheDocument();
    expect(attachments.mock.lastCall![0].evidence).toHaveLength(1);
    expect(attachments.mock.lastCall![0].evidence[0].url).toBe('https://example.org/evidence.pdf');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
