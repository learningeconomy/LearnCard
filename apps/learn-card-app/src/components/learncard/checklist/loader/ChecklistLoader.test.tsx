import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

const { closeModal } = vi.hoisted(() => ({ closeModal: vi.fn() }));
vi.mock('learn-card-base', () => ({
    UploadTypesEnum: {
        Resume: 'resume',
        Certificate: 'certificate',
        Transcript: 'transcript',
        Diploma: 'diploma',
        RawVC: 'rawVC',
    },
    ProfilePicture: () => null,
    useModal: () => ({ closeModal }),
}));
vi.mock('@ionic/react', () => ({ IonSpinner: () => null }));
vi.mock('swiper/react', () => ({
    Swiper: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    SwiperSlide: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('swiper/modules', () => ({ Autoplay: {} }));
vi.mock('../../../../theme/hooks/useTheme', () => ({
    default: () => ({ colors: { defaults: { primaryColor: 'grayscale-900' } } }),
}));
vi.mock('../../../../i18n/mDynamic', () => ({ mDynamic: () => 'Extracting…' }));
vi.mock('../../../../paraglide/messages.js', () => ({
    'passport.buildMyLearnCard.loader.waitingForCapacity': () => 'Waiting for a turn…',
    'passport.buildMyLearnCard.loader.notifyWhenReady': () => 'Notify Me When Ready',
    'common.cancel': () => 'Cancel',
}));

import { UploadTypesEnum } from 'learn-card-base';
import { ChecklistLoader } from './ChecklistLoader';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('ChecklistLoader admission waiting', () => {
    it('shows waiting feedback and cancels waiting without dismissing accepted work', () => {
        const cancel = vi.fn();
        const dismiss = vi.fn();
        const { rerender } = render(
            <ChecklistLoader
                fileType={UploadTypesEnum.Resume}
                waitingForCapacity
                onCancelWait={cancel}
                onDismiss={dismiss}
            />
        );
        expect(screen.getByRole('status').textContent).toBe('Waiting for a turn…');
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(cancel).toHaveBeenCalledOnce();
        expect(dismiss).not.toHaveBeenCalled();
        expect(closeModal).not.toHaveBeenCalled();

        rerender(<ChecklistLoader fileType={UploadTypesEnum.Resume} onDismiss={dismiss} />);
        expect(screen.queryByRole('status')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Notify Me When Ready' }));
        expect(dismiss).toHaveBeenCalledOnce();
    });

    it('keeps the existing modal dismissal when processing has started', () => {
        render(<ChecklistLoader fileType={UploadTypesEnum.Certificate} />);
        fireEvent.click(screen.getByRole('button', { name: 'Notify Me When Ready' }));
        expect(closeModal).toHaveBeenCalledOnce();
    });

    it('does not dismiss a waiting upload when the cancel callback is missing', () => {
        const dismiss = vi.fn();
        const { rerender } = render(
            <ChecklistLoader
                fileType={UploadTypesEnum.Resume}
                waitingForCapacity
                onDismiss={dismiss}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(dismiss).not.toHaveBeenCalled();
        expect(closeModal).not.toHaveBeenCalled();
        rerender(<ChecklistLoader fileType={UploadTypesEnum.Resume} waitingForCapacity />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(closeModal).not.toHaveBeenCalled();
    });
});
