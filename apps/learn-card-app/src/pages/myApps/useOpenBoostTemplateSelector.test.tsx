import React from 'react';
import { renderHook, act } from '@testing-library/react';

const newModal = vi.fn();
const closeModal = vi.fn();
const checkAndPromptRecovery = vi.fn((cb: () => void) => cb());

vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal, closeModal }),
    ModalTypes: { Cancel: 'Cancel' },
}));
vi.mock('../../hooks/useBoostRecoveryCheck', () => ({
    default: () => ({ checkAndPromptRecovery }),
}));
vi.mock('../../components/boost/boost-template/BoostTemplateSelector', () => ({
    default: () => null,
}));

import useOpenBoostTemplateSelector from './useOpenBoostTemplateSelector';

describe('useOpenBoostTemplateSelector', () => {
    beforeEach(() => {
        newModal.mockClear();
        closeModal.mockClear();
        checkAndPromptRecovery.mockClear();
    });

    it('closes any open modal, runs the recovery check, then opens BoostTemplateSelector', () => {
        const { result } = renderHook(() => useOpenBoostTemplateSelector());
        act(() => result.current());
        expect(closeModal).toHaveBeenCalledTimes(1);
        expect(checkAndPromptRecovery).toHaveBeenCalledTimes(1);
        expect(newModal).toHaveBeenCalledTimes(1);
        const [, options, modalTypes] = newModal.mock.calls[0];
        expect(options).toMatchObject({ hideButton: true });
        expect(modalTypes).toEqual({ desktop: 'Cancel', mobile: 'Cancel' });
    });
});
