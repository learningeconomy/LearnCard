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

    it('preserves Spanish privacy and connection behavior', () => {
        const es = loadCatalog('es');

        expect(es.networkPrompts.settings.nameDesc).toContain('ni se compartirá');
        expect(es.networkPrompts.settings.photoDesc).toContain('ni se compartirá');
        expect(es.networkPrompts.toasts.lostConn).toContain('no podrás enviar');
        expect(es.notifications.settingConnectionRequestsDesc).toMatch(/aceptar o rechazar/i);
        expect(es.notifications.settingNewBoostsDesc).toMatch(/Historial Laboral/i);
        expect(es.notifications.settingNewBoostsDesc).toMatch(/Insignias/i);
        expect(es.notifications.settingNewBoostsDesc).not.toMatch(/etc\./i);
    });

    it('keeps the complete credential-category list in Arabic', () => {
        const ar = loadCatalog('ar');

        expect(ar.notifications.settingNewBoostsDesc).toContain('الشارات');
    });

    it('preserves trust and privacy in Spanish and Arabic CHAPI copy', () => {
        const es = loadCatalog('es');
        const ar = loadCatalog('ar');

        expect(es.credsBundle.chapiDesc3).toMatch(/confianza/i);
        expect(es.credsBundle.chapiDesc3).toMatch(/privacidad/i);
        expect(ar.credsBundle.chapiDesc3).toContain('الثقة');
        expect(ar.credsBundle.chapiDesc3).toContain('الخصوصية');
    });

    it('preserves per-category and reversible consent controls', () => {
        const es = loadCatalog('es');
        const ar = loadCatalog('ar');

        expect(es.consentFlow.liveSyncDesc).toMatch(/por categoría/i);
        expect(es.consentFlow.liveSyncDesc).toMatch(/en cualquier momento/i);
        expect(es.consentFlow.switchDesc).toMatch(/volver.*Sincronización en Vivo/i);
        expect(ar.consentFlow.liveSyncDesc).toContain('في أي وقت');
        expect(ar.consentFlow.switchDesc).toContain('في أي وقت');
    });

    it('preserves the complete Merit Badge and Troop descriptions', () => {
        const expectedFinalMeaning = {
            es: {
                meritBadges: /dedicación.*hitos/i,
                troops: /objetivos.*juntos/i,
            },
            fr: {
                meritBadges: /engagement.*étapes/i,
                troops: /objectifs.*ensemble/i,
            },
            ar: {
                meritBadges: /تفاني.*محطات/,
                troops: /أهدافهم.*معًا/,
            },
        };

        for (const [locale, patterns] of Object.entries(expectedFinalMeaning)) {
            const catalog = loadCatalog(locale);
            expect(catalog.scoutCategories.meritBadges.descriptor).toMatch(patterns.meritBadges);
            expect(catalog.scoutCategories.troops.descriptor).toMatch(patterns.troops);
        }
    });

    it('keeps the English source catalog proofread', () => {
        const en = loadCatalog('en');
        const sourceCopy = catalogStrings(en).join('\n');

        expect(sourceCopy).not.toMatch(/continuosly|it is never be|ocurred/);
        expect(en.consentFlow.liveSyncDesc).toContain('continuously');
        expect(en.networkPrompts.settings.nameDesc).toContain('will never be displayed');
        expect(en.addressBook.toasts.unableToConnect).toContain('occurred');
    });

    it('keeps the credential sender unambiguous in Spanish', () => {
        const es = loadCatalog('es');

        expect(es.credentialStorage.wouldLikeToSend).toContain(
            '{{origin}} quiere enviarte una credencial'
        );
        expect(es.credentialStorage.wouldLikeToSend).not.toContain('te gustaría');
    });

    it('uses self-custody terminology in French', () => {
        const fr = loadCatalog('fr');

        expect(fr.login.selfCustodial).toContain('auto-garde');
        expect(fr.login.selfCustodial).not.toContain('auto-hébergée');
    });

    it('preserves the literal recovery-email delimiters in every catalog', () => {
        for (const locale of ['en', 'es', 'fr', 'ar']) {
            const catalog = loadCatalog(locale);

            expect(catalog.recovery.email.step2).toContain('"RECOVERY KEY"');
            expect(catalog.recovery.email.step2).toContain('"END RECOVERY KEY"');
        }
    });

    it('uses Spanish sharing and ownership terminology', () => {
        const es = loadCatalog('es');

        expect(es.consentFlow.selectiveSharing).toMatch(/compartid[oa]/i);
        expect(es.consentFlow.switchToSel).toMatch(/compartid[oa]/i);
        expect(es.consentFlow.switchDesc).toMatch(/compartid[oa]/i);
        expect(es.credsBundle.footerTagline).toContain('Tus datos te pertenecen');
    });

    it('uses Tropa consistently throughout the Spanish catalog', () => {
        const es = loadCatalog('es');
        const spanishCopy = catalogStrings(es).join('\n');

        expect(spanishCopy).not.toMatch(/\bTroops?\b/i);
        expect(es.troops.troopNumber).toContain('Tropa');
        expect(es.troops.template.joinTroop).toContain('Tropa');
    });

    it('uses explicit Arabic hierarchy and Campfire terminology', () => {
        const ar = loadCatalog('ar');

        expect(ar.adminTools.bulkImport.assignParentTitle).toContain('الأب');
        expect(ar.adminTools.bulkImport.selectParentOptional).toContain('الأب');
        expect(ar.adminTools.bulkImport.assignParentTitle).not.toContain('أصلي');
        expect(ar.navigation.campfire).toBe('نار المخيم');
        expect(ar.sidemenu.links.campfire).toBe('نار المخيم');
        expect(ar.boostCMS.whatFor).toContain('الغرض');
    });

    it('provides all ten loading messages in every locale', () => {
        for (const locale of ['en', 'es', 'fr', 'ar']) {
            const catalog = loadCatalog(locale);
            expect(Object.values(catalog.login.loadingMessages)).toHaveLength(10);
            expect(Object.values(catalog.login.loadingMessages).every(Boolean)).toBe(true);
        }
    });
});
