import { describe, expect, it } from 'vitest';

import {
    generateOptimizedSrcSet,
    insertParamsToFilestackUrl,
    isOptimizableFilestackUrl,
    optimizeUrl,
} from '../filestack.helpers';

const HANDLE_URL = 'https://cdn.filestackcontent.com/kFZcMGbPTkSYLVY4aoR1';

describe('filestack helpers', () => {
    it('inserts params into standard Filestack CDN URLs', () => {
        expect(
            insertParamsToFilestackUrl('https://cdn.filestackcontent.com/abc', 'resize=width:100/')
        ).toBe('https://cdn.filestackcontent.com/resize=width:100/abc');
    });

    it('returns undefined URLs unchanged', () => {
        expect(insertParamsToFilestackUrl(undefined, 'resize=width:100/')).toBeUndefined();
    });
});

describe('isOptimizableFilestackUrl', () => {
    it('accepts a CDN URL carrying a handle', () => {
        expect(isOptimizableFilestackUrl(HANDLE_URL)).toBe(true);
    });

    it('rejects the CDN root, which has no handle to transform', () => {
        expect(isOptimizableFilestackUrl('https://cdn.filestackcontent.com/')).toBe(false);
    });

    it('rejects non-Filestack URLs', () => {
        expect(isOptimizableFilestackUrl('/branding/desktop-login-bg.png')).toBe(false);
        expect(isOptimizableFilestackUrl(undefined)).toBe(false);
    });
});

describe('optimizeUrl', () => {
    it('resizes and converts, carrying quality on the output task', () => {
        // `quality=value:N` is ignored by Filestack for PNG and WebP output, so
        // quality has to ride on `output` or the rendition comes back full-weight.
        expect(optimizeUrl(HANDLE_URL, { width: 1600 })).toBe(
            `https://cdn.filestackcontent.com/resize=width:1600/output=format:webp,quality:75/kFZcMGbPTkSYLVY4aoR1`
        );
    });

    it('honours explicit quality and format', () => {
        expect(optimizeUrl(HANDLE_URL, { width: 800, quality: 60, format: 'avif' })).toBe(
            `https://cdn.filestackcontent.com/resize=width:800/output=format:avif,quality:60/kFZcMGbPTkSYLVY4aoR1`
        );
    });

    it('replaces existing resize/quality/output tasks rather than stacking them', () => {
        const alreadyOptimized = optimizeUrl(HANDLE_URL, { width: 600 });

        expect(optimizeUrl(alreadyOptimized, { width: 1600 })).toBe(
            optimizeUrl(HANDLE_URL, { width: 1600 })
        );
    });

    it('preserves a leading security policy', () => {
        expect(
            optimizeUrl(
                `https://cdn.filestackcontent.com/security=p:abc,s:def/kFZcMGbPTkSYLVY4aoR1`,
                {
                    width: 1200,
                }
            )
        ).toBe(
            `https://cdn.filestackcontent.com/security=p:abc,s:def/resize=width:1200/output=format:webp,quality:75/kFZcMGbPTkSYLVY4aoR1`
        );
    });

    it('leaves a handle-less CDN URL alone instead of emitting a task-only URL', () => {
        expect(optimizeUrl('https://cdn.filestackcontent.com/', { width: 1200 })).toBe(
            'https://cdn.filestackcontent.com/'
        );
    });

    it('leaves non-Filestack URLs untouched', () => {
        expect(optimizeUrl('/branding/desktop-login-bg.png', { width: 1200 })).toBe(
            '/branding/desktop-login-bg.png'
        );
    });
});

describe('generateOptimizedSrcSet', () => {
    it('emits one candidate per width', () => {
        expect(generateOptimizedSrcSet(HANDLE_URL, [600, 1200])).toBe(
            `${optimizeUrl(HANDLE_URL, { width: 600 })} 600w, ${optimizeUrl(HANDLE_URL, {
                width: 1200,
            })} 1200w`
        );
    });

    it('returns an empty srcset rather than advertising renditions that do not exist', () => {
        // Every width would map to the same untransformable URL otherwise.
        expect(generateOptimizedSrcSet('/branding/desktop-login-bg.png', [600, 1200])).toBe('');
        expect(generateOptimizedSrcSet('https://cdn.filestackcontent.com/', [600, 1200])).toBe('');
    });
});
