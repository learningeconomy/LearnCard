import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const modal = vi.hoisted(() => ({ newModal: vi.fn(), closeModal: vi.fn() }));
const loads = vi.hoisted(() => ({ count: 0 }));

vi.mock('learn-card-base', async () => {
    const { lazyWithRetry } = await import('learn-card-base/helpers/lazyWithRetry');
    return { ModalTypes: { Right: 'right' }, lazyWithRetry, useModal: () => modal };
});
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonSpinner: () => <span>loading wizard</span>,
}));
vi.mock('../components/SkillProfileModal', () => {
    loads.count += 1;
    return {
        default: ({ onClose }: { onClose: () => void }) => (
            <button onClick={onClose}>wizard</button>
        ),
    };
});

import { useSkillProfileModal } from './useSkillProfileModal';

describe('useSkillProfileModal', () => {
    it('does not load the wizard module until it is opened (or warmed after the dashboard settles)', () => {
        renderHook(() => useSkillProfileModal());
        expect(loads.count).toBe(0);
    });

    it('opens the lazily loaded wizard behind a spinner, wired to closeModal', async () => {
        const { result } = renderHook(() => useSkillProfileModal());
        result.current.openSkillProfile();

        expect(modal.newModal).toHaveBeenCalledOnce();
        const [element, options] = modal.newModal.mock.calls[0];
        expect(options).toEqual({ hideButton: true, sectionClassName: 'max-w-[640px]!' });

        render(element);
        expect(screen.getByText('loading wizard')).toBeTruthy();
        (await screen.findByText('wizard')).click();
        expect(modal.closeModal).toHaveBeenCalledOnce();
    });
});
