import { describe, expect, it, vi } from 'vitest';

import { paraglideMissingKeyOnWarn } from '../../paraglideOnWarn';

describe('paraglideMissingKeyOnWarn', () => {
    it('throws on Rollup missing-export warnings for paraglide messages', () => {
        const defaultHandler = vi.fn();

        expect(() =>
            paraglideMissingKeyOnWarn(
                {
                    code: 'MISSING_EXPORT',
                    message:
                        '"missing.key" is not exported by "src/paraglide/messages/_index.js", imported by "src/App.tsx".',
                },
                defaultHandler
            )
        ).toThrow(/\[i18n\].*missing\.key/);

        expect(defaultHandler).not.toHaveBeenCalled();
    });

    it('throws on Vite 8 Rolldown IMPORT_IS_UNDEFINED warnings for paraglide messages', () => {
        const defaultHandler = vi.fn();

        expect(() =>
            paraglideMissingKeyOnWarn(
                {
                    code: 'IMPORT_IS_UNDEFINED',
                    message:
                        "\u001b[33m[IMPORT_IS_UNDEFINED] \u001b[0mImport `missing.key` will always be undefined because there is no matching export in 'src/paraglide/messages.js'",
                },
                defaultHandler
            )
        ).toThrow(/\[i18n\].*missing\.key/);

        expect(defaultHandler).not.toHaveBeenCalled();
    });

    it('passes unrelated vendor missing-export warnings to defaultHandler', () => {
        const defaultHandler = vi.fn();
        const warning = {
            code: 'IMPORT_IS_UNDEFINED',
            message:
                "Import `foo` will always be undefined because there is no matching export in 'node_modules/some-pkg/index.js'",
        };

        paraglideMissingKeyOnWarn(warning, defaultHandler);

        expect(defaultHandler).toHaveBeenCalledOnce();
        expect(defaultHandler).toHaveBeenCalledWith(warning);
    });
});
