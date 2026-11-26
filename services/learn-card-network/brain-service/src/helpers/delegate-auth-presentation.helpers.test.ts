import { AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX } from '@learncard/types';
import { SignJWT, importJWK } from 'jose';
import jwtDecode from 'jwt-decode';
import { beforeAll, describe, expect, it } from 'vitest';

import {
    DELEGATE_TOKEN_CLOCK_SKEW_MS,
    DELEGATE_TOKEN_MAX_LIFETIME_MS,
    readDelegatePresentation,
} from './delegate-auth-presentation.helpers';
import { DELEGATE_GRANT_CHALLENGE_PREFIX } from './delegate-auth-grant.schema';
import { getEmptyLearnCard, getLearnCard } from './learnCard.helpers';
import type { SeedLearnCard } from './learnCard.helpers';

// Real keys and the real verifier: nothing in this file is mocked.
const DELEGATE_SEED = 'a'.repeat(64);
const OTHER_SEED = 'b'.repeat(64);

const AUDIENCE = 'did:web:network.example.com';
const CHALLENGE = `${DELEGATE_GRANT_CHALLENGE_PREFIX}7f3c9a52-0b1e-4c7d-9a41-5d2e8f6b1c90`;

// A fixed bound for the tests that pass `now`: no test waits for a clock.
const VALID_UNTIL = '2030-01-01T00:00:00.000Z';
const UNTIL = Date.parse(VALID_UNTIL);
const FURTHEST_AHEAD_MS = DELEGATE_TOKEN_MAX_LIFETIME_MS + DELEGATE_TOKEN_CLOCK_SKEW_MS;

type JwtHeader = { alg: string; kid: string };
type JwtClaims = Record<string, unknown>;

/**
 * Signs the way a delegate does: a DID-auth presentation as a JWT whose signed payload says
 * until when it is valid. Passing `validUntil: undefined` leaves the bound out.
 */
const delegateToken = async (
    learnCard: SeedLearnCard,
    options: { challenge: string; audience?: string; validUntil?: string }
): Promise<string> => {
    const validUntil =
        'validUntil' in options ? options.validUntil : new Date(Date.now() + 60_000).toISOString();

    const jwt: unknown = await learnCard.invoke.issuePresentation(
        {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiablePresentation'],
            holder: learnCard.id.did(),
            ...(validUntil === undefined ? {} : { validUntil }),
        },
        {
            proofPurpose: 'authentication',
            challenge: options.challenge,
            domain: options.audience,
            proofFormat: 'jwt',
        }
    );

    if (typeof jwt !== 'string') throw new Error('Expected the presentation as a JWT');

    return jwt;
};

/** Signs with `getDidAuthVp`, which cannot write a time bound: legacy tokens are made so. */
const signDidAuthJwt = async (
    learnCard: SeedLearnCard,
    options: { challenge?: string; domain?: string }
): Promise<string> => {
    const jwt = await learnCard.invoke.getDidAuthVp({ ...options, proofFormat: 'jwt' });

    if (typeof jwt !== 'string') throw new Error('Expected the presentation as a JWT');

    return jwt;
};

/**
 * Signs changed claims with the signer's own key. The wallet API always writes its own DID
 * to both `iss` and `vp.holder`, so a token that disagrees with itself has to be built here.
 */
const resign = async (
    signer: SeedLearnCard,
    jwt: string,
    change: { claims?: JwtClaims; header?: Partial<JwtHeader> } = {}
): Promise<string> => {
    const header = jwtDecode<JwtHeader>(jwt, { header: true });
    const claims = jwtDecode<JwtClaims>(jwt);
    const key = await importJWK(signer.id.keypair(), 'EdDSA');

    return new SignJWT({ ...claims, ...change.claims })
        .setProtectedHeader({ ...header, ...change.header })
        .sign(key);
};

// The first character always carries signature bits; the last may be base64 padding bits.
const changeOneSignatureCharacter = (jwt: string): string => {
    const [header, payload, signature = ''] = jwt.split('.');
    const replacement = signature.startsWith('A') ? 'B' : 'A';

    return [header, payload, `${replacement}${signature.slice(1)}`].join('.');
};

/** Swaps the payload under the original header and signature: all a party without the key can do. */
const replacePayload = (jwt: string, claims: JwtClaims): string => {
    const [header, , signature] = jwt.split('.');
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');

    return [header, payload, signature].join('.');
};

const toUnsignedJwt = (payload: unknown): string => {
    const encode = (value: unknown): string =>
        Buffer.from(JSON.stringify(value)).toString('base64url');

    return `${encode({ alg: 'none' })}.${encode(payload)}.signature`;
};

const buildTokens = async () => {
    const delegate = await getLearnCard(DELEGATE_SEED);
    const other = await getLearnCard(OTHER_SEED);
    const delegateDid = delegate.id.did();
    const otherDid = other.id.did();

    const valid = await delegateToken(delegate, { challenge: CHALLENGE, audience: AUDIENCE });
    const vp = jwtDecode<{ vp: JwtClaims }>(valid).vp;

    const fixed = await delegateToken(delegate, {
        challenge: CHALLENGE,
        audience: AUDIENCE,
        validUntil: VALID_UNTIL,
    });
    const fixedClaims = jwtDecode<JwtClaims & { vp: JwtClaims }>(fixed);
    const withValidUntil = (validUntil: unknown): Promise<string> =>
        resign(delegate, fixed, { claims: { vp: { ...fixedClaims.vp, validUntil } } });

    // Signed today with a bound ten years ahead: nothing about the token records when.
    const farFutureUntil = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
    const farFuture = await delegateToken(delegate, {
        challenge: CHALLENGE,
        audience: AUDIENCE,
        validUntil: new Date(farFutureUntil).toISOString(),
    });

    const solanaDid = delegate.id.did('pkh:sol');
    const solanaKid = await delegate.invoke.didToVerificationMethod(solanaDid);

    return {
        delegateDid,
        solanaDid,
        valid,
        resigned: await resign(delegate, valid),
        legacy: await signDidAuthJwt(delegate, {
            challenge: `${AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX}7f3c9a52-0b1e-4c7d-9a41-5d2e8f6b1c90`,
            domain: AUDIENCE,
        }),
        prefixNotAtStart: await signDidAuthJwt(delegate, {
            challenge: `x-${CHALLENGE}`,
            domain: AUDIENCE,
        }),
        withoutNonce: await signDidAuthJwt(delegate, { domain: AUDIENCE }),
        badSignature: changeOneSignatureCharacter(valid),
        holderIsNotIssuer: await resign(delegate, valid, {
            claims: { vp: { ...vp, holder: otherDid } },
        }),
        signedByAnotherKey: await resign(other, valid, {
            header: { kid: await other.invoke.didToVerificationMethod(otherDid) },
        }),
        withoutAudience: await delegateToken(delegate, { challenge: CHALLENGE }),
        audienceList: await resign(delegate, valid, { claims: { aud: [AUDIENCE] } }),
        twoAudiences: await resign(delegate, valid, {
            claims: { aud: [AUDIENCE, 'did:web:other.example.com'] },
        }),
        issuerIsNotDidKey: await resign(delegate, valid, {
            claims: { iss: solanaDid, vp: { ...vp, holder: solanaDid } },
            header: { kid: solanaKid },
        }),
        fixed,
        farFuture,
        farFutureUntil,
        fixedResigned: await withValidUntil(VALID_UNTIL),
        unbounded: await delegateToken(delegate, {
            challenge: CHALLENGE,
            audience: AUDIENCE,
            validUntil: undefined,
        }),
        oldMinting: await signDidAuthJwt(delegate, { challenge: CHALLENGE, domain: AUDIENCE }),
        signedAlreadyExpired: await delegateToken(delegate, {
            challenge: CHALLENGE,
            audience: AUDIENCE,
            validUntil: new Date(Date.now() - 1_000).toISOString(),
        }),
        withoutMilliseconds: await withValidUntil('2030-01-01T00:00:00Z'),
        withOffset: await withValidUntil('2030-01-01T00:00:00.000+00:00'),
        asNumber: await withValidUntil(UNTIL),
        alteredAfterSigning: replacePayload(fixed, {
            ...fixedClaims,
            vp: { ...fixedClaims.vp, validUntil: new Date(UNTIL + 60_000).toISOString() },
        }),
    };
};

const NOT_A_DELEGATE_TOKEN = { isDelegateToken: false };
const DELEGATE_TOKEN_WITHOUT_PRESENTATION = { isDelegateToken: true, presentation: undefined };

describe('readDelegatePresentation', () => {
    let tokens: Awaited<ReturnType<typeof buildTokens>>;

    beforeAll(async () => {
        tokens = await buildTokens();
    });

    it('a did:key presentation over challenge and audience verifies and exposes signer, issuer, holder, audience and challenge', async () => {
        const { delegateDid, valid: jwt } = tokens;

        // The signer writes `domain` to `aud` as one string and `challenge` to `nonce`.
        expect(jwtDecode<Record<string, unknown>>(jwt)).toMatchObject({
            iss: delegateDid,
            aud: AUDIENCE,
            nonce: CHALLENGE,
            vp: { holder: delegateDid },
        });
        expect(jwtDecode<Record<string, unknown>>(jwt, { header: true })).toMatchObject({
            kid: expect.stringMatching(new RegExp(`^${delegateDid}#`)),
        });

        await expect(readDelegatePresentation(jwt)).resolves.toEqual({
            isDelegateToken: true,
            presentation: {
                signerDid: delegateDid,
                issuerDid: delegateDid,
                holderDid: delegateDid,
                audience: AUDIENCE,
                challenge: CHALLENGE,
            },
        });
    });

    it('a token valid for one minute verifies and exposes the same five fields as before', async () => {
        const { delegateDid, fixed: jwt } = tokens;
        const claims = jwtDecode<JwtClaims>(jwt);

        // The bound is a date inside the signed presentation: the wallet writes no JWT time claim.
        expect(claims).toMatchObject({ vp: { holder: delegateDid, validUntil: VALID_UNTIL } });
        expect(claims).not.toHaveProperty('exp');
        expect(claims).not.toHaveProperty('iat');
        expect(claims).not.toHaveProperty('nbf');

        await expect(readDelegatePresentation(jwt, UNTIL - 60_000)).resolves.toEqual({
            isDelegateToken: true,
            presentation: {
                signerDid: delegateDid,
                issuerDid: delegateDid,
                holderDid: delegateDid,
                audience: AUDIENCE,
                challenge: CHALLENGE,
            },
        });
    });

    it('a token without validUntil has no presentation', async () => {
        const { vp } = jwtDecode<{ vp: JwtClaims }>(tokens.unbounded);

        expect(vp).toMatchObject({ holder: tokens.delegateDid });
        expect(vp).not.toHaveProperty('validUntil');

        await expect(readDelegatePresentation(tokens.unbounded)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('a token made with getDidAuthVp has no presentation', async () => {
        // Control: the verifier itself accepts this token, so the time bound is what refuses it.
        const verifier = await getEmptyLearnCard();
        const verification = await verifier.invoke.verifyPresentation(tokens.oldMinting, {
            proofFormat: 'jwt',
            challenge: CHALLENGE,
            domain: AUDIENCE,
        });

        expect(verification).toMatchObject({ warnings: [], errors: [] });
        expect(jwtDecode<{ vp: JwtClaims }>(tokens.oldMinting).vp).not.toHaveProperty('validUntil');

        await expect(readDelegatePresentation(tokens.oldMinting)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('an expired token has no presentation', async () => {
        // Control: one millisecond before its bound the same token is accepted.
        await expect(readDelegatePresentation(tokens.fixed, UNTIL - 1)).resolves.toMatchObject({
            presentation: { signerDid: tokens.delegateDid },
        });

        await expect(readDelegatePresentation(tokens.fixed, UNTIL)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
        await expect(readDelegatePresentation(tokens.fixed, UNTIL + 1)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );

        // The wallet signs a date in the past without complaint; the server's own clock refuses it.
        await expect(readDelegatePresentation(tokens.signedAlreadyExpired)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('a token whose bound is exactly max lifetime plus skew ahead is accepted, and one millisecond further is refused', async () => {
        expect(DELEGATE_TOKEN_MAX_LIFETIME_MS).toBe(5 * 60 * 1000);
        expect(DELEGATE_TOKEN_CLOCK_SKEW_MS).toBe(30 * 1000);

        await expect(
            readDelegatePresentation(tokens.fixed, UNTIL - FURTHEST_AHEAD_MS)
        ).resolves.toMatchObject({ presentation: { signerDid: tokens.delegateDid } });

        await expect(
            readDelegatePresentation(tokens.fixed, UNTIL - FURTHEST_AHEAD_MS - 1)
        ).resolves.toEqual(DELEGATE_TOKEN_WITHOUT_PRESENTATION);
    });

    // The window is anchored on `validUntil`, which the signer chooses, not on the moment of
    // signing: these pin what the verifier enforces, and that it is not "five minutes after signing".
    it('a token signed with a far-future validUntil is refused now', async () => {
        const { farFuture, farFutureUntil } = tokens;

        expect(farFutureUntil - Date.now()).toBeGreaterThan(FURTHEST_AHEAD_MS);

        await expect(readDelegatePresentation(farFuture)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
        await expect(readDelegatePresentation(farFuture, Date.now())).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('a token signed with a far-future validUntil is accepted only during the last window before that validUntil', async () => {
        const { farFuture, farFutureUntil, delegateDid } = tokens;
        const accepted = { presentation: { signerDid: delegateDid } };

        // Opening boundary: one millisecond before the window it is refused, at its first
        // millisecond it is accepted, years after it was signed.
        await expect(
            readDelegatePresentation(farFuture, farFutureUntil - FURTHEST_AHEAD_MS - 1)
        ).resolves.toEqual(DELEGATE_TOKEN_WITHOUT_PRESENTATION);
        await expect(
            readDelegatePresentation(farFuture, farFutureUntil - FURTHEST_AHEAD_MS)
        ).resolves.toMatchObject(accepted);

        // Just inside the window.
        await expect(
            readDelegatePresentation(farFuture, farFutureUntil - 60_000)
        ).resolves.toMatchObject(accepted);

        // Closing boundary: accepted one millisecond before validUntil, refused at it and after it.
        await expect(
            readDelegatePresentation(farFuture, farFutureUntil - 1)
        ).resolves.toMatchObject(accepted);
        await expect(readDelegatePresentation(farFuture, farFutureUntil)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
        await expect(readDelegatePresentation(farFuture, farFutureUntil + 1)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('validUntil in another date format, with an offset, or as a number has no presentation', async () => {
        const now = UNTIL - 60_000;
        const validUntilOf = (jwt: string): unknown =>
            jwtDecode<{ vp: JwtClaims }>(jwt).vp.validUntil;

        // Control: signing outside the wallet is not what makes these tokens unacceptable.
        expect(validUntilOf(tokens.fixedResigned)).toBe(VALID_UNTIL);
        await expect(readDelegatePresentation(tokens.fixedResigned, now)).resolves.toEqual(
            await readDelegatePresentation(tokens.fixed, now)
        );

        // Each names the very same instant, so only its form is at fault.
        expect(Date.parse(String(validUntilOf(tokens.withoutMilliseconds)))).toBe(UNTIL);
        expect(Date.parse(String(validUntilOf(tokens.withOffset)))).toBe(UNTIL);
        expect(validUntilOf(tokens.asNumber)).toBe(UNTIL);

        await expect(readDelegatePresentation(tokens.withoutMilliseconds, now)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
        await expect(readDelegatePresentation(tokens.withOffset, now)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
        await expect(readDelegatePresentation(tokens.asNumber, now)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('a validUntil altered after signing has no presentation', async () => {
        const altered = jwtDecode<{ vp: JwtClaims }>(tokens.alteredAfterSigning);
        const [, , signature] = tokens.fixed.split('.');

        // One minute later than what was signed, and still inside the window at `now`.
        expect(altered.vp.validUntil).toBe(new Date(UNTIL + 60_000).toISOString());
        expect(altered).toEqual({
            ...jwtDecode<JwtClaims>(tokens.fixed),
            vp: { ...altered.vp },
        });
        expect(tokens.alteredAfterSigning.split('.')[2]).toBe(signature);

        await expect(readDelegatePresentation(tokens.fixed, UNTIL - 1)).resolves.toMatchObject({
            presentation: { signerDid: tokens.delegateDid },
        });
        await expect(
            readDelegatePresentation(tokens.alteredAfterSigning, UNTIL - 1)
        ).resolves.toEqual(DELEGATE_TOKEN_WITHOUT_PRESENTATION);
    });

    it('a legacy auth-grant: nonce is not a delegate token', async () => {
        await expect(readDelegatePresentation(tokens.legacy)).resolves.toEqual(
            NOT_A_DELEGATE_TOKEN
        );
    });

    it('a nonce that only contains the delegate prefix is not a delegate token', async () => {
        await expect(readDelegatePresentation(tokens.prefixNotAtStart)).resolves.toEqual(
            NOT_A_DELEGATE_TOKEN
        );
    });

    it('a token without a nonce is not a delegate token', async () => {
        await expect(readDelegatePresentation(tokens.withoutNonce)).resolves.toEqual(
            NOT_A_DELEGATE_TOKEN
        );
    });

    it('a string that is not a JWT is not a delegate token', async () => {
        await expect(readDelegatePresentation('not-a-jwt')).resolves.toEqual(NOT_A_DELEGATE_TOKEN);
        await expect(readDelegatePresentation('')).resolves.toEqual(NOT_A_DELEGATE_TOKEN);
    });

    it('a delegate-prefixed token whose signature does not verify is a delegate token without a presentation', async () => {
        expect(tokens.badSignature).not.toBe(tokens.valid);
        expect(jwtDecode(tokens.badSignature)).toEqual(jwtDecode(tokens.valid));

        await expect(readDelegatePresentation(tokens.badSignature)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('a token whose holder differs from its issuer has no presentation', async () => {
        // Control: signing outside the wallet is not what makes the token unacceptable.
        await expect(readDelegatePresentation(tokens.resigned)).resolves.toEqual(
            await readDelegatePresentation(tokens.valid)
        );

        await expect(readDelegatePresentation(tokens.holderIsNotIssuer)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it("a token signed by a key that is not its issuer's has no presentation", async () => {
        await expect(readDelegatePresentation(tokens.signedByAnotherKey)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('a token without an audience has no presentation', async () => {
        expect(jwtDecode<JwtClaims>(tokens.withoutAudience)).not.toHaveProperty('aud');

        await expect(readDelegatePresentation(tokens.withoutAudience)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('a token whose audience is a list has no presentation', async () => {
        await expect(readDelegatePresentation(tokens.audienceList)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
        await expect(readDelegatePresentation(tokens.twoAudiences)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('an issuer that is not a did:key has no presentation', async () => {
        // Control: the verifier itself accepts this token, so the did:key rule is what refuses it.
        const verifier = await getEmptyLearnCard();
        const verification = await verifier.invoke.verifyPresentation(tokens.issuerIsNotDidKey, {
            proofFormat: 'jwt',
            challenge: CHALLENGE,
            domain: AUDIENCE,
        });

        expect(tokens.solanaDid).toMatch(/^did:pkh:/);
        expect(verification).toMatchObject({ warnings: [], errors: [] });

        await expect(readDelegatePresentation(tokens.issuerIsNotDidKey)).resolves.toEqual(
            DELEGATE_TOKEN_WITHOUT_PRESENTATION
        );
    });

    it('never throws', async () => {
        const { delegateDid, solanaDid, ...signed } = tokens;
        const inputs = [
            ...Object.values(signed),
            '',
            'not-a-jwt',
            'a.b.c',
            toUnsignedJwt(null),
            toUnsignedJwt({ nonce: CHALLENGE }),
            toUnsignedJwt({ nonce: CHALLENGE, iss: 42, aud: {}, vp: 'holder' }),
            toUnsignedJwt({ nonce: CHALLENGE, iss: delegateDid, aud: AUDIENCE, vp: null }),
            toUnsignedJwt({ nonce: CHALLENGE, iss: solanaDid, aud: [AUDIENCE] }),
            toUnsignedJwt({
                nonce: CHALLENGE,
                iss: delegateDid,
                aud: AUDIENCE,
                vp: { holder: delegateDid, validUntil: {} },
            }),
            toUnsignedJwt({
                nonce: CHALLENGE,
                iss: delegateDid,
                aud: AUDIENCE,
                vp: { holder: delegateDid, validUntil: '9999-99-99T99:99:99.999Z' },
            }),
        ];

        for (const input of inputs) {
            await expect(readDelegatePresentation(input)).resolves.toEqual(
                expect.objectContaining({ isDelegateToken: expect.any(Boolean) })
            );
        }
    });
});
