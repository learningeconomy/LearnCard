import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { inAppMessageValidator } from '@learncard/types';
import { InAppMessageRichFields } from './InAppMessageRichFields';
import { buildDraftJson, initialState, type BuilderState } from './inAppMessageBuilderState';

afterEach(cleanup);

it('restricts the action editor to the final screen and recovers after reordering an override', () => {
    const Builder = () => {
        const [state, setState] = useState<BuilderState>({
            ...initialState,
            title: 'Test story',
            presentation: 'story',
            steps: [{ title: 'First' }, { title: 'Last', actions: [] }],
        });
        return (
            <>
                <InAppMessageRichFields
                    state={state}
                    onChange={patch => setState(current => ({ ...current, ...patch }))}
                />
                <button disabled={!inAppMessageValidator.safeParse(buildDraftJson(state)).success}>
                    Preview
                </button>
            </>
        );
    };
    render(<Builder />);
    expect(screen.getAllByRole('checkbox', { name: 'Override final-screen actions' })).toHaveLength(
        1
    );
    expect(screen.getByRole('button', { name: 'Preview' }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(
        within(screen.getByRole('group', { name: 'Screen 2' })).getByRole('button', {
            name: 'Move up',
        })
    );
    expect(screen.getByRole('alert').textContent).toContain(
        'Only the final screen can have actions'
    );
    expect(screen.getByRole('button', { name: 'Preview' }).hasAttribute('disabled')).toBe(true);
    expect(
        within(screen.getByRole('group', { name: 'Screen 1' })).queryByRole('checkbox')
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove action override' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Preview' }).hasAttribute('disabled')).toBe(false);
});
