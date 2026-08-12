import { describe, it, expect } from 'vitest';

import { getNotificationMessage, NotificationMessageKey } from '@helpers/notificationMessages';

/**
 * LC-1831 C2 — unit tests for the server-side notification message catalog.
 * These are pure (no DB/network) and verify interpolation, locale fallback,
 * and that the catalog is structurally complete (every key × locale).
 */

const SUPPORTED_KEYS = [
    'boostReceived',
    'boostAccepted',
    'credentialReceived',
    'endorsementReceived',
    'connectionAccepted',
    'connectionRequest',
    'connectionRequestExpiredInvite',
    'presentationReceived',
    'issuanceDelivered',
    'issuanceClaimed',
    'issuanceError',
    'guardianApprovalPending',
    'guardianApproved',
    'guardianRejected',
    'parentAccountApproved',
    'appListingSubmitted',
    'appListingWithdrawn',
    'appListingApproved',
    'appListingRejected',
    'consentFlowViewRequest',
    'consentFlowInvite',
    'consentFlowShare',
    'consentFlowTransactionCreated',
    'consentFlowInsightsShared',
    'consentFlowTransactionReconsented',
    'consentFlowTransactionUpdatedTerms',
    'consentFlowTransactionWithdrawn',
    'consentFlowTransactionSyncedSingle',
    'consentFlowTransactionSyncedPlural',
    'credentialRevokedNamed',
    'credentialRevokedUnnamed',
    'credentialSuspendedNamed',
    'credentialSuspendedUnnamed',
    'credentialRestoredNamed',
    'credentialRestoredUnnamed',
] as NotificationMessageKey[];

const LOCALES = ['en', 'es', 'fr', 'ar'];

describe('notificationMessages catalog', () => {
    it('exposes every key defined in the union', () => {
        for (const key of SUPPORTED_KEYS) {
            const msg = getNotificationMessage(key, 'en');
            expect(typeof msg.title).toBe('string');
            expect(typeof msg.body).toBe('string');
            expect(msg.title.length).toBeGreaterThan(0);
            expect(msg.body.length).toBeGreaterThan(0);
        }
    });

    it('returns a message for every key in every supported locale', () => {
        for (const locale of LOCALES) {
            for (const key of SUPPORTED_KEYS) {
                const { title, body } = getNotificationMessage(key, locale);
                expect(title, `${locale}/${key} title`).toBeTruthy();
                expect(body, `${locale}/${key} body`).toBeTruthy();
            }
        }
    });
});

describe('getNotificationMessage — interpolation', () => {
    it('interpolates {var} placeholders from params', () => {
        const msg = getNotificationMessage('boostReceived', 'en', { issuer: 'ACME' });
        expect(msg.title).toBe('Boost Received');
        expect(msg.body).toBe('ACME has boosted you!');
    });

    it('leaves unknown placeholders verbatim', () => {
        const msg = getNotificationMessage('boostReceived', 'en');
        expect(msg.body).toBe('{issuer} has boosted you!');
    });

    it('interpolates multiple params in title and body', () => {
        const msg = getNotificationMessage('issuanceDelivered', 'en', {
            issuer: 'Iss',
            recipientType: 'email',
            recipientValue: 'a@b.com',
        });
        expect(msg.title).toBe('Credential Delivered to Inbox');
        expect(msg.body).toBe("Iss sent a credential to email's inbox at a@b.com!");
    });

    it('returns a localized body for a non-EN locale', () => {
        const es = getNotificationMessage('boostReceived', 'es', { issuer: 'ACME' });
        expect(es.body).toBe('¡ACME te ha enviado un reconocimiento!');
        expect(es.title).toBe('Reconocimiento recibido');
    });

    it('localizes named credential lifecycle notifications', () => {
        const es = getNotificationMessage('credentialRevokedNamed', 'es', {
            credentialName: 'Insignia de seguridad',
            issuer: 'ACME',
        });

        expect(es.title).toBe('Credencial revocada');
        expect(es.body).toBe('Tu credencial "Insignia de seguridad" fue revocada por ACME.');
    });
});

describe('getNotificationMessage — locale fallback', () => {
    it('falls back to EN when the locale is unsupported', () => {
        const msg = getNotificationMessage('boostReceived', 'de', { issuer: 'X' });
        // 'de' is not in the catalog → English fallback
        expect(msg.body).toBe('X has boosted you!');
    });

    it('normalizes BCP-47 region tags (es-MX → es)', () => {
        const msg = getNotificationMessage('boostReceived', 'es-MX', { issuer: 'X' });
        expect(msg.body).toBe('¡X te ha enviado un reconocimiento!');
    });

    it('falls back to EN for an empty/undefined locale', () => {
        expect(getNotificationMessage('boostReceived', '', { issuer: 'X' }).body).toBe(
            'X has boosted you!'
        );
    });

    it('never throws for unknown keys (returns EN entry shape)', () => {
        // @ts-expect-error — intentionally invalid key
        const msg = getNotificationMessage('doesNotExist', 'en');
        // The lookup `?? CATALOGS.en[key]` is undefined → title/body interpolate undefined.
        // The contract is "never throws"; assert it does not throw and returns an object.
        expect(typeof msg.title).toBe('string');
        expect(typeof msg.body).toBe('string');
    });
});
