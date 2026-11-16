import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResumeBuilderToolbar } from './ResumeBuilderToolbar';

vi.mock('@ionic/react', () => ({
    IonHeader: ({ children }: React.PropsWithChildren) => <header>{children}</header>,
    IonToolbar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSpinner: () => <span />,
}));

afterEach(cleanup);

describe('ResumeBuilderToolbar busy labels', () => {
    it.each([
        ['download', false, 'Generating PDF…'],
        ['preview', false, 'Generating PDF…'],
        ['publish', false, 'Publishing…'],
        ['publish', true, 'Saving...'],
    ] as const)('announces %s in editing mode %s as %s', (action, editing, label) => {
        const view = render(
            <ResumeBuilderToolbar
                loadingAction={action}
                isMobile
                isEditingExistingResume={editing}
                historyControl={null}
                onBack={vi.fn()}
                onPreview={vi.fn()}
                onDownload={vi.fn()}
                onPublish={vi.fn()}
            />
        );
        const button = view.getByRole('button', { name: label });
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(button.hasAttribute('disabled')).toBe(true);
    });
});
