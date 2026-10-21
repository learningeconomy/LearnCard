import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_TOAST_OPTIONS, toastStore, ToastTypeEnum } from './toastStore';

describe('toastStore', () => {
    beforeEach(() => {
        toastStore.set.dismissToast();
    });

    it('keeps the fully specified defaults immutable', () => {
        expect(Object.isFrozen(DEFAULT_TOAST_OPTIONS)).toBe(true);
    });

    it('does not carry options from one toast into the next', () => {
        toastStore.set.presentToast('Saved', {
            type: ToastTypeEnum.Success,
            hasCheckmark: true,
            autoDismiss: false,
        });

        toastStore.set.presentToast('Failed', {
            type: ToastTypeEnum.Error,
            hasX: true,
        });

        expect(toastStore.get.options()).toEqual({
            ...DEFAULT_TOAST_OPTIONS,
            type: ToastTypeEnum.Error,
            hasX: true,
        });
    });

    it('keeps status icons mutually exclusive', () => {
        toastStore.set.presentToast('Failed', {
            type: ToastTypeEnum.Error,
            hasCheckmark: true,
            hasX: true,
        });

        expect(toastStore.get.options()).toMatchObject({
            hasCheckmark: false,
            hasX: true,
        });

        toastStore.set.presentToast('Saved', {
            type: ToastTypeEnum.Success,
            hasCheckmark: true,
            hasX: true,
        });

        expect(toastStore.get.options()).toMatchObject({
            hasCheckmark: true,
            hasX: false,
        });
    });

    it('lets a partial icon update replace the current status icon', () => {
        toastStore.set.presentToast('Failed', {
            type: ToastTypeEnum.Error,
            hasX: true,
        });

        toastStore.set.setOptions({ hasCheckmark: true });

        expect(toastStore.get.options()).toMatchObject({
            hasCheckmark: true,
            hasX: false,
        });
    });
});
