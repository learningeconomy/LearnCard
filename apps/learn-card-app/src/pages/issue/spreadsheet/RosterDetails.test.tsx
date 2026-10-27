import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RosterDetails, RosterEditor, type RosterDetailsProps } from './RosterDetails';
import { makeRun } from './fixtures.test-support';

vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));

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
    it.each([1440, 390])(
        'edits multiline descriptions without expanding every row at %spx',
        width => {
            vi.stubGlobal('innerWidth', width);
            const data: RosterDetailsProps = {
                ...props(2),
                variables: ['description', 'name'],
                longTextVariables: ['description'],
                scopes: { description: 'perRecipient', name: 'perRecipient' },
                values: { 'row-0': { description: 'First line\nSecond line', name: 'Ada' } },
            };
            render(<RosterEditor {...data} onClose={vi.fn()} />);
            const description = screen.getByRole('textbox', { name: 'Person0 Description' });
            expect(description.tagName).toBe('TEXTAREA');
            expect(description).toHaveAttribute('rows', '3');
            expect(description).not.toHaveAttribute('maxlength');
            expect(description).toHaveAccessibleDescription('22 / 5,000 characters');
            fireEvent.click(screen.getByRole('button', { name: 'Expand Person0 Description' }));
            expect(description).toHaveAttribute('rows', '7');
            expect(screen.getByRole('textbox', { name: 'Person1 Description' })).toHaveAttribute(
                'rows',
                '3'
            );
            expect(screen.getByRole('textbox', { name: 'Person0 Name' }).tagName).toBe('INPUT');
            fireEvent.change(description, {
                target: { value: 'A long description\nwith another paragraph.' },
            });
            expect(data.onChange).toHaveBeenCalledWith(
                'row-0',
                'description',
                'A long description\nwith another paragraph.'
            );
        }
    );
    it('uses the same multiline editor for shared descriptions and preserves oversized imports', () => {
        const data: RosterDetailsProps = {
            ...props(1),
            variables: ['description'],
            longTextVariables: ['description'],
            scopes: { description: 'shared' },
            shared: { description: 'x'.repeat(5001) },
            problems: { 'row-0': ['length'] },
            fieldProblems: {
                'row-0': { recipient: [], evidence: [], variables: { description: ['length'] } },
            },
        };
        render(<RosterEditor {...data} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Credential fields · 1'));
        const shared = screen.getByRole('textbox', { name: 'Description', exact: true });
        expect(shared.tagName).toBe('TEXTAREA');
        expect(shared).toHaveValue('x'.repeat(5001));
        expect(shared).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Use at most 5,000 characters for this field.')).toBeVisible();
        expect(screen.getByRole('textbox', { name: 'Person0 Description' })).toBeDisabled();
    });
    it('preserves an oversized paste and identifies the field to shorten', () => {
        const data: RosterDetailsProps = {
            ...props(1),
            variables: ['description'],
            longTextVariables: ['description'],
            scopes: { description: 'perRecipient' },
        };
        const view = render(<RosterEditor {...data} onClose={vi.fn()} />);
        const text = 'Full paragraph\n'.repeat(400);
        fireEvent.change(screen.getByRole('textbox', { name: 'Person0 Description' }), {
            target: { value: text },
        });
        expect(data.onChange).toHaveBeenCalledWith('row-0', 'description', text);
        view.rerender(
            <RosterEditor
                {...data}
                onClose={vi.fn()}
                values={{ 'row-0': { description: text } }}
                problems={{ 'row-0': ['length'] }}
                fieldProblems={{
                    'row-0': {
                        recipient: [],
                        evidence: [],
                        variables: { description: ['length'] },
                    },
                }}
            />
        );
        const field = screen.getByRole('textbox', { name: 'Person0 Description' });
        expect(field).toHaveValue(text);
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(field).toHaveAccessibleDescription(/Use at most 5,000 characters/);
        expect(screen.getByText('6,000 / 5,000 characters')).toHaveClass('text-red-700');
    });
    it('separates evidence for everyone from each person’s extra evidence', () => {
        const data: RosterDetailsProps = {
            ...props(2),
            sharedEvidence: [
                {
                    id: 'shared',
                    type: 'document',
                    url: 'https://example.test/course.pdf',
                    title: 'Course outline',
                },
            ],
            attachments: {
                'row-0': [
                    {
                        id: 'personal',
                        type: 'link',
                        url: 'https://example.test/ada',
                        title: 'Ada portfolio',
                    },
                ],
            },
        };
        render(<RosterEditor {...data} onClose={vi.fn()} />);
        const shared = screen.getByRole('region', { name: 'Evidence for everyone' });
        expect(within(shared).getByText('Course outline')).toBeVisible();
        expect(
            within(shared).getByText(
                'Included for every person. Edit these items in Evidence & media.'
            )
        ).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Files & links for this person (1)' })
        ).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Files & links for this person (0)' })
        ).toBeVisible();
        const evidence = screen.getByRole('textbox', { name: 'Extra evidence link for Person1' });
        expect(evidence).toHaveValue('');
        fireEvent.change(evidence, { target: { value: 'https://example.test/bao' } });
        expect(data.onEvidenceChange).toHaveBeenCalledWith('row-1', 'https://example.test/bao');
        expect(data.sharedEvidence).toHaveLength(1);
    });
    it.each([1440, 390])('shows shared errors only on editable shared controls at %spx', width => {
        vi.stubGlobal('innerWidth', width);
        const data: RosterDetailsProps = {
            ...props(30),
            variables: ['credits', 'completed', 'score'],
            dateVariables: ['completed'],
            scopes: { credits: 'shared', completed: 'shared', score: 'shared' },
            shared: { credits: 'not-a-number', completed: 'not-a-date', score: '' },
            fieldProblems: {},
        };
        for (const row of data.recipients) {
            data.problems[row.rowId!] = ['number', 'date', 'required'];
            data.fieldProblems![row.rowId!] = {
                recipient: [],
                evidence: [],
                variables: { credits: ['number'], completed: ['date'], score: ['required'] },
            };
        }
        render(<RosterEditor {...data} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Credential fields · 3'));
        for (const label of ['Credits', 'Completed', 'Score']) {
            const shared = screen.getByRole('textbox', { name: label });
            expect(shared).toBeEnabled();
            expect(shared).toHaveAttribute('aria-invalid', 'true');
            expect(shared).toHaveAttribute('aria-describedby');
            const row = screen.getByLabelText(`Person0 ${label}`);
            expect(row).toBeDisabled();
            expect(row).toHaveAttribute('aria-invalid', 'false');
            expect(row).not.toHaveAttribute('aria-describedby');
        }
        expect(
            screen.getAllByText('Use a number with a decimal point, without units.')
        ).toHaveLength(1);
        expect(screen.getAllByText('Use YYYY-MM-DD or a timestamp with a timezone.')).toHaveLength(
            1
        );
        expect(screen.queryByText('Original value: not-a-date')).toBeNull();
        expect(screen.getByRole('textbox', { name: 'Completed' })).toHaveValue('not-a-date');
        expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(3);
        expect(screen.getByRole('button', { name: 'Needs attention · 30' })).toBeVisible();
    });
    it.each([1440, 390])(
        'associates errors with their own fields and clears them on correction at %spx',
        width => {
            vi.stubGlobal('innerWidth', width);
            const data: RosterDetailsProps = {
                ...props(3),
                variables: ['credits', 'completed', 'proof'],
                dateVariables: ['completed'],
                scopes: {
                    credits: 'perRecipient',
                    completed: 'perRecipient',
                    proof: 'perRecipient',
                },
                values: {
                    'row-0': {
                        credits: 'not-a-number',
                        completed: '2026-10-01',
                        proof: 'https://proof.test/a',
                    },
                    'row-1': {
                        credits: '1.5',
                        completed: 'not-a-date',
                        proof: 'https://proof.test/b',
                    },
                    'row-2': { credits: '1.5', completed: '2026-10-01', proof: 'not-a-link' },
                },
                problems: { 'row-0': ['number'], 'row-1': ['date'], 'row-2': ['evidence'] },
                fieldProblems: {
                    'row-0': { recipient: [], evidence: [], variables: { credits: ['number'] } },
                    'row-1': { recipient: [], evidence: [], variables: { completed: ['date'] } },
                    'row-2': { recipient: [], evidence: [], variables: { proof: ['evidence'] } },
                },
            };
            const view = render(<RosterEditor {...data} onClose={vi.fn()} />);
            const credit = screen.getByLabelText('Person0 Credits');
            const date = screen.getByLabelText('Person1 Completed');
            const evidence = screen.getByLabelText('Person2 Proof');
            for (const field of [credit, date, evidence]) {
                expect(field).toHaveAttribute('aria-invalid', 'true');
                const message = document.getElementById(field.getAttribute('aria-describedby')!);
                expect(message).toBeVisible();
                expect(field.closest('td') ?? field.closest('label')).toContainElement(message);
            }
            expect(credit).toHaveAccessibleDescription(
                'Use a number with a decimal point, without units.'
            );
            expect(date).toHaveAccessibleDescription(
                'Use YYYY-MM-DD or a timestamp with a timezone.'
            );
            expect(evidence).toHaveAccessibleDescription(
                'Enter a complete http or https evidence link.'
            );
            expect(screen.getByLabelText('Email for Person0')).toHaveAttribute(
                'aria-invalid',
                'false'
            );
            expect(screen.getByLabelText('Person0 Proof')).toHaveAttribute('aria-invalid', 'false');
            fireEvent.change(credit, { target: { value: '1.5' } });
            expect(data.onChange).toHaveBeenCalledWith('row-0', 'credits', '1.5');
            view.rerender(
                <RosterEditor
                    {...data}
                    problems={{}}
                    fieldProblems={{}}
                    values={Object.fromEntries(
                        Object.keys(data.values).map(row => [
                            row,
                            {
                                credits: '1.5',
                                completed: '2026-10-01',
                                proof: 'https://proof.test/ok',
                            },
                        ])
                    )}
                    onClose={vi.fn()}
                />
            );
            for (const field of [credit, date, evidence]) {
                expect(field).toHaveAttribute('aria-invalid', 'false');
                expect(field).not.toHaveAttribute('aria-describedby');
            }
        }
    );
    it('marks an editable shared value and the additional evidence field separately', () => {
        render(
            <RosterEditor
                {...props(1)}
                variables={['credits']}
                scopes={{ credits: 'shared' }}
                shared={{ credits: '' }}
                problems={{ 'row-0': ['required', 'evidence'] }}
                fieldProblems={{
                    'row-0': {
                        recipient: [],
                        evidence: ['evidence'],
                        variables: { credits: ['required'] },
                    },
                }}
                onClose={vi.fn()}
            />
        );
        fireEvent.click(screen.getByText('Credential fields · 1'));
        expect(screen.getByRole('textbox', { name: 'Credits' })).toHaveAttribute(
            'aria-invalid',
            'true'
        );
        expect(screen.getByLabelText('Person0 Credits')).toBeDisabled();
        expect(screen.getByLabelText('Extra evidence link for Person0')).toHaveAttribute(
            'aria-invalid',
            'true'
        );
        expect(screen.getByLabelText('Email for Person0')).toHaveAttribute('aria-invalid', 'false');
    });
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
            saveError: 'Changes could not be saved.',
        };
        parent.rerender(<RosterDetails {...next} />);
        const field = within(editor.container).getByRole('textbox', { name: 'Email for Updated' });
        expect(field).toHaveValue('updated@test.com');
        expect(within(editor.container).getByRole('alert')).toHaveTextContent(next.saveError);
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
    it('keeps a corrected issue visible until the person leaves the row', () => {
        vi.stubGlobal('innerWidth', 390);
        const data = props(3);
        const view = render(
            <RosterEditor {...data} problems={{ 'row-1': ['email'] }} onClose={vi.fn()} />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Needs attention · 1' }));
        const input = screen.getByRole('textbox', { name: 'Email for Person1' });
        fireEvent.focus(input);
        view.rerender(<RosterEditor {...data} problems={{}} onClose={vi.fn()} />);
        expect(screen.getAllByRole('article')).toHaveLength(1);
        fireEvent.blur(input, { relatedTarget: screen.getByRole('searchbox') });
        expect(screen.queryByRole('article')).toBeNull();
    });
    it('keeps attempted failed rows editable but prevents removing their recovery history', () => {
        render(<RosterEditor {...props(1)} canRemove={() => false} onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: /^Skip$/ })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: /Email for/ })).toBeEnabled();
    });
    it('keeps a valid row on its current page while its email is being corrected', () => {
        vi.stubGlobal('innerWidth', 1440);
        const data = props(60);
        const view = render(<RosterEditor {...data} onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /^Next$/ }));
        const input = screen.getByRole('textbox', { name: 'Email for Person40' });
        fireEvent.focus(input);
        view.rerender(
            <RosterEditor {...data} problems={{ 'row-40': ['email'] }} onClose={vi.fn()} />
        );
        expect(screen.getByRole('textbox', { name: 'Email for Person40' })).toBe(input);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        fireEvent.blur(input, { relatedTarget: screen.getByRole('searchbox') });
        expect(screen.queryByRole('textbox', { name: 'Email for Person40' })).toBeNull();
    });
    it('uses the saved date for locked shared fields and never guesses a date from a column name', () => {
        render(
            <RosterEditor
                {...props(1)}
                variables={['award', 'date_code']}
                dateVariables={['award']}
                scopes={{ award: 'shared', date_code: 'perRecipient' }}
                shared={{ award: '2026-10-19T00:00:00.000Z' }}
                values={{ 'row-0': { award: '2026-10-01T00:00:00.000Z', date_code: '0012' } }}
                locked={() => true}
                onClose={vi.fn()}
            />
        );
        expect(screen.getByLabelText('Person0 Award')).toHaveValue('2026-10-01');
        expect(screen.getByLabelText('Person0 Award')).toBeDisabled();
        expect(screen.getByRole('textbox', { name: 'Person0 Date Code' })).toHaveValue('0012');
    });
    it('shows shared values consistently and preserves locked row controls', () => {
        render(
            <RosterEditor
                {...props(1)}
                variables={['score']}
                shared={{ score: '99' }}
                values={{ 'row-0': { score: '95' } }}
                scopes={{ score: 'shared' }}
                locked={() => true}
                onClose={vi.fn()}
            />
        );
        expect(screen.getByRole('textbox', { name: 'Person0 Score' })).toHaveValue('95');
        expect(screen.getByRole('textbox', { name: 'Person0 Score' })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: /Email for/ })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: /Extra evidence link for/ })).toBeDisabled();
    });
});
