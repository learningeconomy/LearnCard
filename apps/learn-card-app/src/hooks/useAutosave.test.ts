import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from './useAutosave';

const STORAGE_KEY = 'test_autosave';
const STORAGE_VERSION = 1;

type TestState = { name: string; value: number };
type TestExtra = { id: string };

const makeStoredEntry = (
    data: TestState,
    overrides: Partial<{ version: number; timestamp: number; extra: TestExtra }> = {}
): string =>
    JSON.stringify({
        version: overrides.version ?? STORAGE_VERSION,
        timestamp: overrides.timestamp ?? Date.now(),
        data,
        storageKey: STORAGE_KEY,
        ...('extra' in overrides ? { extra: overrides.extra } : {}),
    });

describe('useAutosave', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ─── Recovery on mount ───────────────────────────────────────────

    it('recovers saved state from localStorage on mount', () => {
        const saved: TestState = { name: 'draft', value: 42 };
        localStorage.setItem(STORAGE_KEY, makeStoredEntry(saved));

        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY })
        );

        expect(result.current.hasRecoveredState).toBe(true);
        expect(result.current.recoveredState).toEqual(saved);
        expect(result.current.recoveredStorageKey).toBe(STORAGE_KEY);
    });

    it('recovers extra metadata alongside state', () => {
        const saved: TestState = { name: 'draft', value: 1 };
        const extra: TestExtra = { id: 'abc' };
        localStorage.setItem(STORAGE_KEY, makeStoredEntry(saved, { extra }));

        const { result } = renderHook(() =>
            useAutosave<TestState, TestExtra>({ storageKey: STORAGE_KEY })
        );

        expect(result.current.recoveredExtra).toEqual(extra);
    });

    it('does not recover when localStorage is empty', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY })
        );

        expect(result.current.hasRecoveredState).toBe(false);
        expect(result.current.recoveredState).toBeNull();
    });

    it('discards state with wrong version', () => {
        const saved: TestState = { name: 'old', value: 0 };
        localStorage.setItem(STORAGE_KEY, makeStoredEntry(saved, { version: 999 }));

        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY })
        );

        expect(result.current.hasRecoveredState).toBe(false);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('discards expired state', () => {
        const saved: TestState = { name: 'expired', value: 0 };
        const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
        localStorage.setItem(
            STORAGE_KEY,
            makeStoredEntry(saved, { timestamp: twentyFiveHoursAgo })
        );

        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY })
        );

        expect(result.current.hasRecoveredState).toBe(false);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('respects custom maxAgeMs', () => {
        const saved: TestState = { name: 'recent', value: 1 };
        const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
        localStorage.setItem(
            STORAGE_KEY,
            makeStoredEntry(saved, { timestamp: twoMinutesAgo })
        );

        const { result } = renderHook(() =>
            useAutosave<TestState>({
                storageKey: STORAGE_KEY,
                maxAgeMs: 60 * 1000, // 1 minute
            })
        );

        expect(result.current.hasRecoveredState).toBe(false);
    });

    it('does not recover when hasContent returns false', () => {
        const saved: TestState = { name: '', value: 0 };
        localStorage.setItem(STORAGE_KEY, makeStoredEntry(saved));

        const { result } = renderHook(() =>
            useAutosave<TestState>({
                storageKey: STORAGE_KEY,
                hasContent: state => Boolean(state?.name),
            })
        );

        expect(result.current.hasRecoveredState).toBe(false);
    });

    it('does not recover when enabled is false', () => {
        const saved: TestState = { name: 'draft', value: 1 };
        localStorage.setItem(STORAGE_KEY, makeStoredEntry(saved));

        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY, enabled: false })
        );

        expect(result.current.hasRecoveredState).toBe(false);
    });

    // ─── Saving ──────────────────────────────────────────────────────

    it('saves state to localStorage after debounce', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY, debounceMs: 500 })
        );

        act(() => {
            result.current.saveToLocal({ name: 'new', value: 99 });
        });

        // Not saved yet (debounce hasn't elapsed)
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

        // Advance past debounce
        act(() => {
            vi.advanceTimersByTime(600);
        });

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.data).toEqual({ name: 'new', value: 99 });
        expect(stored.version).toBe(STORAGE_VERSION);
    });

    it('debounces multiple rapid saves', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY, debounceMs: 500 })
        );

        act(() => {
            result.current.saveToLocal({ name: 'first', value: 1 });
        });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        act(() => {
            result.current.saveToLocal({ name: 'second', value: 2 });
        });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        act(() => {
            result.current.saveToLocal({ name: 'third', value: 3 });
        });

        // Advance past debounce from last save
        act(() => {
            vi.advanceTimersByTime(600);
        });

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.data).toEqual({ name: 'third', value: 3 });
    });

    it('sets hasUnsavedChanges to true after saveToLocal', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY })
        );

        expect(result.current.hasUnsavedChanges).toBe(false);

        act(() => {
            result.current.saveToLocal({ name: 'change', value: 1 });
        });

        expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('does not save when enabled is false', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState>({
                storageKey: STORAGE_KEY,
                enabled: false,
                debounceMs: 100,
            })
        );

        act(() => {
            result.current.saveToLocal({ name: 'nope', value: 0 });
        });
        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('saves extra metadata alongside state', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState, TestExtra>({
                storageKey: STORAGE_KEY,
                debounceMs: 100,
            })
        );

        act(() => {
            result.current.saveToLocal({ name: 'with-extra', value: 5 }, { id: 'xyz' });
        });
        act(() => {
            vi.advanceTimersByTime(200);
        });

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.extra).toEqual({ id: 'xyz' });
    });

    // ─── Clearing ────────────────────────────────────────────────────

    it('clearLocalSave removes entry from localStorage', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY, debounceMs: 100 })
        );

        act(() => {
            result.current.saveToLocal({ name: 'to-clear', value: 1 });
        });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

        act(() => {
            result.current.clearLocalSave();
        });

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('clearRecoveredState without flag keeps localStorage intact', () => {
        const saved: TestState = { name: 'draft', value: 1 };
        localStorage.setItem(STORAGE_KEY, makeStoredEntry(saved));

        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY })
        );

        expect(result.current.hasRecoveredState).toBe(true);

        act(() => {
            result.current.clearRecoveredState();
        });

        expect(result.current.hasRecoveredState).toBe(false);
        expect(result.current.recoveredState).toBeNull();
        // localStorage should still have the entry
        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    it('clearRecoveredState(true) also clears localStorage', () => {
        const saved: TestState = { name: 'draft', value: 1 };
        localStorage.setItem(STORAGE_KEY, makeStoredEntry(saved));

        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY })
        );

        act(() => {
            result.current.clearRecoveredState(true);
        });

        expect(result.current.hasRecoveredState).toBe(false);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    // ─── Unmount behavior ────────────────────────────────────────────

    it('saves immediately on unmount if there is pending state', () => {
        const { result, unmount } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY, debounceMs: 5000 })
        );

        act(() => {
            result.current.saveToLocal({ name: 'pending', value: 77 });
        });

        // Not saved yet (debounce is 5 seconds)
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

        // Unmount should trigger immediate save
        unmount();

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.data).toEqual({ name: 'pending', value: 77 });
    });

    // ─── Visibility change ───────────────────────────────────────────

    it('saves immediately when tab becomes hidden', () => {
        const { result } = renderHook(() =>
            useAutosave<TestState>({ storageKey: STORAGE_KEY, debounceMs: 5000 })
        );

        act(() => {
            result.current.saveToLocal({ name: 'tab-hidden', value: 10 });
        });

        // Not saved yet
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

        // Simulate tab becoming hidden
        act(() => {
            Object.defineProperty(document, 'visibilityState', {
                value: 'hidden',
                writable: true,
                configurable: true,
            });
            document.dispatchEvent(new Event('visibilitychange'));
        });

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(stored.data).toEqual({ name: 'tab-hidden', value: 10 });

        // Reset visibilityState
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            writable: true,
            configurable: true,
        });
    });
});
