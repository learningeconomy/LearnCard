import type { Locator, Page } from '@playwright/test';
import type { VC } from '@learncard/types';

import { openBoostAFriendBadgePicker } from '../../../tests/test.helpers';
import { expect } from '../expect';
import type { VerificationLearnCard } from '../sdk';
import type { VerificationActor } from '../types';

export const UI_TIMEOUT = 60_000;
export const LOGIN = /\/login(?:[?#]|$)/;
export const WALLET = /\/wallet(?:[?#]|$)/;
export const BADGES = /\/socialBadges(?:[?#]|$)/;

export const assertEnglishLogin = async (page: Page): Promise<void> => {
    await expect(page).toHaveURL(LOGIN);
    await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible({
        timeout: UI_TIMEOUT,
    });
    await expect(
        page.getByRole('button', { name: 'Sign in with Email', exact: true })
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
};

/** Open the profile menu on /wallet and require this actor's public handle. */
export const assertProfile = async (page: Page, actor: VerificationActor): Promise<void> => {
    await expect(page).toHaveURL(WALLET);
    await page.getByRole('button', { name: 'Open profile', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible();
    await expect(page.getByText(actor.profileId, { exact: false }).first()).toBeVisible({
        timeout: UI_TIMEOUT,
    });
};

/** Boost a Friend → pick the stock "Vibe Curator" badge → personalize its title. */
export const personalizeBadge = async (page: Page, title: string): Promise<void> => {
    await openBoostAFriendBadgePicker(page);
    await page.getByPlaceholder('Search badges...').fill('Vibe Curator');
    await page.getByRole('button', { name: /Vibe Curator/ }).click();
    await page.getByPlaceholder('e.g. Trailblazer').fill(title);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Send to', exact: true })).toBeVisible();
};

export const issueSelfBadge = async (page: Page, title: string): Promise<void> => {
    await personalizeBadge(page, title);
    await page.getByRole('button', { name: 'Just me', exact: true }).click();
    await page.getByRole('button', { name: 'Boost Myself', exact: true }).click();
    await expect(
        page.getByRole('heading', { name: 'Added to your Passport!', exact: true })
    ).toBeVisible({
        timeout: UI_TIMEOUT,
    });
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.waitForURL(BADGES, { timeout: UI_TIMEOUT });
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
};

/** Reload from /wallet, open Badges, and open the stored credential's detail card. */
export const openStoredBadge = async (page: Page, title: string): Promise<Locator> => {
    await page.goto('/wallet');
    await page.reload();
    await expect(page).toHaveURL(WALLET);
    await page.getByRole('button', { name: /Badges/i }).click();
    await page.waitForURL(BADGES);
    await page.getByText(title, { exact: true }).first().click();
    const card = page.getByRole('dialog').getByRole('group', { name: title, exact: true });
    await expect(card).toBeVisible({ timeout: UI_TIMEOUT });
    // The card heading reads "<category> <title>", e.g. "Social Badge Verify self 1a2b".
    await expect(card.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(card.locator('.issued-by')).toBeVisible();
    return card;
};

export const readIssuer = async (card: Locator): Promise<string> => {
    const issuer = card.locator('.issued-by');
    await expect(issuer).toBeVisible();
    await expect(issuer).not.toHaveText(/loading|unknown/i);
    const text = (await issuer.innerText()).replace(/\s+/g, ' ').trim();
    expect(text.length).toBeGreaterThan(3);
    return text;
};

/** Resolve the UI's unique title from the actor's persisted index, not a separate SDK fixture. */
export const assertStoredCredential = async (
    learnCard: VerificationLearnCard,
    expected: { title: string; issuerDid: string; subjectDid: string; uri?: string }
) => {
    const records = await learnCard.index.LearnCloud.get();
    const resolved = await Promise.all(
        records.map(async record => ({
            record,
            credential: (await learnCard.read.get(record.uri)) as VC | undefined,
        }))
    );
    const matches = resolved.filter(({ credential }) => credential?.name === expected.title);
    expect(matches).toHaveLength(1);
    const { record, credential } = matches[0]!;
    if (!credential) throw new Error(`Stored credential not found: ${expected.title}`);
    expect(record.uri).toBeTruthy();
    if (expected.uri !== undefined) expect(record.uri).toBe(expected.uri);
    expect(credential.name).toBe(expected.title);
    const issuerDid =
        typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    if (typeof issuerDid !== 'string') throw new Error('Stored credential has no issuer DID');
    expect(issuerDid).toBe(expected.issuerDid);
    const subjects = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject
        : [credential.credentialSubject];
    expect(subjects).toHaveLength(1);
    expect(subjects[0]?.id).toBe(expected.subjectDid);
    const verification = await learnCard.invoke.verifyCredential(credential);
    expect(verification.errors).toEqual([]);
    expect(verification.checks).toContain('proof');
    return {
        indexId: record.id,
        uri: record.uri,
        title: credential.name,
        issuerDid,
        subjectDid: subjects[0]!.id,
        verification,
    };
};

/** Claim the single pending credential from Alerts, accept it, and skip the connect prompt. */
export const claimFromNotifications = async (page: Page, title: string): Promise<void> => {
    await page.goto('/notifications');
    const claim = page.getByRole('button', { name: /claim/i });
    await expect(claim).toHaveCount(1, { timeout: UI_TIMEOUT });
    await claim.click();
    await expect(page.getByRole('group', { name: title, exact: true })).toBeVisible();
    const accept = page.getByRole('button', { name: 'Accept', exact: true });
    await expect(accept).toBeEnabled();
    await accept.click();
    const connect = page.getByRole('heading', { name: /^Connect with .+\?$/i });
    await expect(connect).toBeVisible({ timeout: UI_TIMEOUT });
    await page.getByRole('button', { name: 'Skip for Now', exact: true }).click();
    await expect(connect).toBeHidden();
};
