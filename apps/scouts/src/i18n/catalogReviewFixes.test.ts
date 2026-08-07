/// <reference types="node" />

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const loadCatalog = (locale: string) =>
    JSON.parse(
        readFileSync(
            fileURLToPath(
                new URL(`../../public/locales/${locale}/translation.json`, import.meta.url)
            ),
            'utf8'
        )
    );

const catalogStrings = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (!value || typeof value !== 'object') return [];
    return Object.values(value).flatMap(catalogStrings);
};

describe('reviewed catalog copy', () => {
    it('keeps the full Arabic account-deletion warning and credential terminology', () => {
        const ar = loadCatalog('ar');

        expect(ar.userProfile.deleteWarning).toContain('لا يمكن التراجع');
        expect(ar.userProfile.deleteWarning).toContain('بيانات اعتماد');
        expect(ar.userProfile.deleteWarning).not.toContain('مؤهلات');
    });

    it('explains Spanish email recovery and keeps passkey labels in Spanish', () => {
        const es = loadCatalog('es');
        const recoveryCopy = catalogStrings(es.recovery).join('\n');

        expect(es.recovery.setup.email.desc).toContain('clave de recuperación');
        expect(recoveryCopy).not.toMatch(/passkey/i);
    });

    it('uses French upload terminology without changing download actions', () => {
        const fr = loadCatalog('fr');

        expect(fr.common.upload).toBe('Téléverser');
        expect(fr.boostCMS.uploading).toContain('Téléversement');
        expect(fr.recovery.setup.backup.downloadBtn).toContain('Télécharger');
    });

    it('describes proof verification without claiming factual accuracy', () => {
        for (const locale of ['en', 'es', 'fr', 'ar']) {
            const catalog = loadCatalog(locale);
            expect(catalog.sdk.verification.infoText).not.toMatch(
                /accuracy|precisi[oó]n|exactitude|دقتها/i
            );
            expect(catalog.troops.verify.infoText).not.toMatch(
                /accuracy|precisi[oó]n|exactitude|دقتها/i
            );
        }
    });

    it('keeps competencies distinct from credentials', () => {
        for (const locale of ['en', 'es', 'fr', 'ar']) {
            const catalog = loadCatalog(locale);
            expect(catalog.skillFrameworks.compDesc).toMatch(
                /credential|credencial|justificatif|اعتماد/i
            );
            expect(catalog.skillFrameworks.compDesc).not.toMatch(
                /is a verified credential|es una credencial|est un justificatif|هي مؤهل/i
            );
        }
    });
});
