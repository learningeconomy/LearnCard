import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createBoundedShareLinkDiagnosticReporter,
    createShareLinkDependencyResolver,
    SHARE_LINK_COMPOSITION_DIAGNOSTIC,
} from '@helpers/share-link-owner/diagnostics';

const { OWNER_CONFIGURATION_INVALID, OWNER_INITIALIZATION_FAILED } =
    SHARE_LINK_COMPOSITION_DIAGNOSTIC;

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createBoundedShareLinkDiagnosticReporter', () => {
    it('emits each fixed category at most once', () => {
        const sink = vi.fn();
        const report = createBoundedShareLinkDiagnosticReporter(sink);

        report(OWNER_CONFIGURATION_INVALID);
        report(OWNER_CONFIGURATION_INVALID);
        report(OWNER_INITIALIZATION_FAILED);
        report(OWNER_INITIALIZATION_FAILED);

        expect(sink).toHaveBeenCalledTimes(2);
        expect(sink).toHaveBeenNthCalledWith(1, OWNER_CONFIGURATION_INVALID);
        expect(sink).toHaveBeenNthCalledWith(2, OWNER_INITIALIZATION_FAILED);
    });

    it('emits a value-free sanitized event through the default sink', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        createBoundedShareLinkDiagnosticReporter()(OWNER_CONFIGURATION_INVALID);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith('share_link_composition_diagnostic', {
            category: OWNER_CONFIGURATION_INVALID,
        });
    });
});

describe('createShareLinkDependencyResolver', () => {
    const categories = {
        configurationInvalidCategory: OWNER_CONFIGURATION_INVALID,
        initializationFailedCategory: OWNER_INITIALIZATION_FAILED,
    } as const;

    it('stays silent and inert for intentionally disabled configuration', async () => {
        const initializeDependencies = vi.fn();
        const reportDiagnostic = vi.fn();
        const resolve = createShareLinkDependencyResolver({
            resolveConfig: () => ({ status: 'disabled' as const }),
            initializeDependencies,
            reportDiagnostic,
            configurationInvalidCategory: OWNER_CONFIGURATION_INVALID,
            initializationFailedCategory: OWNER_INITIALIZATION_FAILED,
        });

        await expect(resolve()).resolves.toBeNull();

        expect(initializeDependencies).not.toHaveBeenCalled();
        expect(reportDiagnostic).not.toHaveBeenCalled();
    });

    it('reports malformed/partial wiring once across repeated requests', async () => {
        const initializeDependencies = vi.fn();
        const sink = vi.fn();
        const reportDiagnostic = createBoundedShareLinkDiagnosticReporter(sink);
        const resolve = createShareLinkDependencyResolver({
            resolveConfig: () => ({ status: 'invalid' as const }),
            initializeDependencies,
            reportDiagnostic,
            ...categories,
        });

        await expect(resolve()).resolves.toBeNull();
        await expect(resolve()).resolves.toBeNull();

        expect(initializeDependencies).not.toHaveBeenCalled();
        expect(sink).toHaveBeenCalledTimes(1);
        expect(sink).toHaveBeenCalledWith(OWNER_CONFIGURATION_INVALID);
    });

    it('reports a failed build once, rethrows, and rebuilds on the next request', async () => {
        const initializeDependencies = vi
            .fn<() => Promise<{ ready: boolean }>>()
            .mockRejectedValueOnce(new Error('raw initialization secret'))
            .mockResolvedValue({ ready: true });
        const sink = vi.fn();
        const resolve = createShareLinkDependencyResolver<{ ready: boolean }>({
            resolveConfig: () => ({ status: 'enabled' as const }),
            initializeDependencies,
            reportDiagnostic: createBoundedShareLinkDiagnosticReporter(sink),
            ...categories,
        });

        await expect(resolve()).rejects.toThrow('raw initialization secret');
        await expect(resolve()).resolves.toEqual({ ready: true });

        // The failed attempt was not cached; the later success was retried.
        expect(initializeDependencies).toHaveBeenCalledTimes(2);
        // Bounded: only the first failure emitted a diagnostic.
        expect(sink).toHaveBeenCalledTimes(1);
        expect(sink).toHaveBeenCalledWith(OWNER_INITIALIZATION_FAILED);
    });

    it('shares a successful build across concurrent callers', async () => {
        const build = vi.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
            return { ready: true };
        });
        const { createRetryableLazyInitializer } =
            await import('@helpers/share-link-owner/lazy-initializer');
        const resolve = createShareLinkDependencyResolver({
            resolveConfig: () => ({ status: 'enabled' as const }),
            initializeDependencies: createRetryableLazyInitializer(build),
            reportDiagnostic: vi.fn(),
            ...categories,
        });

        const [first, second] = await Promise.all([resolve(), resolve()]);

        expect(build).toHaveBeenCalledTimes(1);
        expect(first).toEqual({ ready: true });
        expect(second).toBe(first);
    });
});
