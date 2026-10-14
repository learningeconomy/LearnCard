import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RosterDetails, type RosterDetailsProps } from './RosterDetails';
import { makeRun } from './fixtures.test-support';

vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    ModalTypes: { Freeform: 'freeform', Center: 'center' },
}));
const props = (count: number): RosterDetailsProps => ({
    recipients: makeRun(count).draft.recipients,
    variables: [],
    scopes: {},
    shared: {},
    values: {},
    evidence: {},
    attachments: {},
    problems: {},
    locked: () => false,
    onRecipientsChange: vi.fn(),
    onScopeChange: vi.fn(),
    onSharedChange: vi.fn(),
    onChange: vi.fn(),
    onEvidenceChange: vi.fn(),
    onDownload: vi.fn(),
    onUpload: vi.fn(),
    onAttachmentsChange: vi.fn(),
});
describe('roster review layout', () => {
    it('uses cards for three people and a table starting at four', () => {
        const view = render(<RosterDetails {...props(3)} />);
        expect(screen.queryByRole('table')).toBeNull();
        view.rerender(<RosterDetails {...props(4)} />);
        expect(screen.getByRole('table')).toBeInTheDocument();
    });
    it('bounds table rendering to 50 rows while retaining the full roster', () => {
        const data = props(60);
        render(<RosterDetails {...data} />);
        expect(screen.getAllByRole('row')).toHaveLength(51);
        fireEvent.click(screen.getByRole('button', { name: /^Next$/ }));
        expect(screen.getAllByRole('row')).toHaveLength(11);
        expect(data.onRecipientsChange).not.toHaveBeenCalled();
    });
});
