// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { build } from 'vite';

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

    it('fails a real Vite 8 Rolldown build when a namespace access references a missing Paraglide key', async () => {
        await expect(
            build({
                configFile: false,
                logLevel: 'silent',
                build: {
                    write: false,
                    rollupOptions: {
                        input: 'virtual:entry',
                        onwarn: paraglideMissingKeyOnWarn,
                    },
                },
                plugins: [
                    {
                        name: 'paraglide-missing-key-fixture',
                        resolveId(id) {
                            if (id === 'virtual:entry') return '/virtual/src/entry.js';
                            if (id === './paraglide/messages.js')
                                return '/virtual/src/paraglide/messages.js';
                            if (id === './messages/_index.js')
                                return '/virtual/src/paraglide/messages/_index.js';
                            return undefined;
                        },
                        load(id) {
                            if (id === '/virtual/src/entry.js')
                                return 'import * as m from "./paraglide/messages.js"; console.log(m["no.such.key"]());';
                            if (id === '/virtual/src/paraglide/messages.js')
                                return 'export * from "./messages/_index.js";';
                            if (id === '/virtual/src/paraglide/messages/_index.js')
                                return 'export const present = () => "ok";';
                            return undefined;
                        },
                    },
                ],
            })
        ).rejects.toThrow(/\[i18n\].*no\.such\.key/);
    });
});
