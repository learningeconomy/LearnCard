import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RosterDetails, RosterEditor, type RosterDetailsProps } from './RosterDetails';
import { makeRun } from './fixtures.test-support';

const modal = vi.hoisted(() => ({
    open: vi.fn((_node: React.ReactNode, ..._rest: unknown[]) => ({ id: 1, generation: 1 })),
    close: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useModal: () => ({
        newModal: vi.fn(),
        closeModal: vi.fn(),
        newModalWithToken: modal.open,
        forceCloseModalByToken: modal.close,
    }),
    ModalTypes: { Freeform: 'freeform', Center: 'center', FullScreen: 'fullscreen' },
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
afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});
describe('roster review workspace', () => {
    it('keeps the issue page compact and connects the open editor to current parent props', () => {
        const data = props(250);
        const parent = render(<RosterDetails {...data} />);
        expect(screen.queryByRole('textbox')).toBeNull();
        expect(screen.queryByRole('table')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Review people' }));
        expect(modal.open).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ className: 'issue-spreadsheet-dialog' }),
            { desktop: 'center', mobile: 'fullscreen' }
        );
        const editor = render(modal.open.mock.calls[0][0]);
        const next = {
            ...data,
            recipients: [{ ...data.recipients[0], email: 'updated@test.com' }],
            onRecipientsChange: vi.fn(),
        };
        parent.rerender(<RosterDetails {...next} />);
        const field = within(editor.container).getByRole('textbox', { name: 'Email for Updated' });
        expect(field).toHaveValue('updated@test.com');
        fireEvent.change(field, { target: { value: 'corrected@test.com' } });
        expect(next.onRecipientsChange).toHaveBeenCalledWith([
            expect.objectContaining({ email: 'corrected@test.com' }),
        ]);
        expect(data.onRecipientsChange).not.toHaveBeenCalled();
        parent.unmount();
        expect(modal.close).toHaveBeenCalledWith({ id: 1, generation: 1 });
    });
    it('uses a table on desktop, bounded to 25 rows, with search across all recipients', () => {
        vi.stubGlobal('innerWidth', 1440);
        const data = props(60);
        render(<RosterEditor {...data} onClose={vi.fn()} />);
        expect(screen.getAllByRole('row')).toHaveLength(26);
        fireEvent.click(screen.getByRole('button', { name: /^Next$/ }));
        expect(screen.getAllByRole('row')).toHaveLength(26);
        fireEvent.change(screen.getByRole('searchbox', { name: 'Search people' }), {
            target: { value: 'person59@test.com' },
        });
        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getByRole('textbox', { name: 'Email for Person59' })).toBeVisible();
        expect(data.onRecipientsChange).not.toHaveBeenCalled();
    });
    it('uses editable cards at mobile width and can isolate issues', () => {
        vi.stubGlobal('innerWidth', 390);
        const data = props(3);
        render(<RosterEditor {...data} problems={{ 'row-1': ['email'] }} onClose={vi.fn()} />);
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.getAllByRole('article')).toHaveLength(3);
        fireEvent.click(screen.getByRole('button', { name: 'Needs attention · 1' }));
        expect(screen.getAllByRole('article')).toHaveLength(1);
        expect(screen.getByRole('textbox', { name: 'Email for Person1' })).toHaveAttribute(
            'aria-invalid',
            'true'
        );
    });
    it('keeps attempted failed rows editable but prevents removing their recovery history', () => {
        render(<RosterEditor {...props(1)} canRemove={() => false} onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: /^Skip$/ })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: /Email for/ })).toBeEnabled();
    });
    it('shows shared values consistently and preserves locked row controls', () => {
        render(
            <RosterEditor
                {...props(1)}
                variables={['score']}
                shared={{ score: '95' }}
                scopes={{ score: 'shared' }}
                locked={() => true}
                onClose={vi.fn()}
            />
        );
        expect(screen.getByRole('textbox', { name: 'Person0 Score' })).toHaveValue('95');
        expect(screen.getByRole('textbox', { name: 'Person0 Score' })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: /Email for/ })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: /Evidence for/ })).toBeDisabled();
    });
});
