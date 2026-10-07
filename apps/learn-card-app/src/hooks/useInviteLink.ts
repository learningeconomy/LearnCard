import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { useWallet, switchedProfileStore } from 'learn-card-base';

import { getAppBaseUrl } from '../config/bootstrapTenantConfig';

/** 30 days, matching the ticket's stated link lifetime. */
export const INVITE_EXPIRATION_SECONDS = 30 * 24 * 60 * 60;

/**
 * The server maps a requested `maxUses` of 0 onto an unlimited invite — see
 * `setValidInviteForProfile` in the brain service. Unlimited invites read back
 * from `listInvites` with `maxUses === null`.
 */
export const UNLIMITED_MAX_USES = 0;

export type ListedInvite = {
    challenge: string;
    expiresIn: number | null;
    usesRemaining: number | null;
    maxUses: number | null;
};

export type InviteLink = {
    url: string;
    challenge: string;
    profileId: string;
    expiresIn: number | null;
};

/** `null` means "never expires", which outranks any finite lifetime. */
const lifetimeRank = (expiresIn: number | null): number =>
    expiresIn === null ? Number.POSITIVE_INFINITY : expiresIn;

/**
 * Pick the invite that can serve as a durable personal link.
 *
 * Only unlimited invites qualify. A single-use invite — which is what the older
 * ShareModal flow mints — would work for exactly one recipient and then start
 * failing for everyone else who opens the same shared link.
 */
export const selectReusableInvite = (invites: ListedInvite[]): ListedInvite | undefined =>
    [...invites]
        .filter(invite => invite.maxUses === null)
        .sort((a, b) => {
            const rankA = lifetimeRank(a.expiresIn);
            const rankB = lifetimeRank(b.expiresIn);

            if (rankA === rankB) return 0;

            return rankB - rankA;
        })[0];

const buildInviteUrl = (baseUrl: string, challenge: string, profileId: string): string =>
    `${baseUrl}/invite?challenge=${encodeURIComponent(challenge)}&profileId=${encodeURIComponent(
        profileId
    )}`;

type InviteCapableWallet = {
    invoke: {
        listInvites?: () => Promise<ListedInvite[]>;
        getProfile: (profileId?: string) => Promise<{ profileId?: string } | undefined>;
        generateInvite: (
            challenge?: string,
            expiration?: number,
            maxUses?: number
        ) => Promise<{ profileId: string; challenge: string; expiresIn: number | null }>;
    };
};

/**
 * Resolve the user's personal invite link, reusing one they already have.
 *
 * Written as a plain function over the wallet so it can be tested without
 * react-query or a mocked `learn-card-base`.
 */
export const resolveInviteLink = async (
    wallet: InviteCapableWallet,
    baseUrl: string
): Promise<InviteLink> => {
    const invites = (await wallet.invoke.listInvites?.()) ?? [];
    const existing = selectReusableInvite(invites);

    if (existing) {
        const profileId = (await wallet.invoke.getProfile())?.profileId;

        if (!profileId) {
            throw new Error('Unable to resolve your profile to build an invite link');
        }

        return {
            url: buildInviteUrl(baseUrl, existing.challenge, profileId),
            challenge: existing.challenge,
            profileId,
            expiresIn: existing.expiresIn,
        };
    }

    const generated = await wallet.invoke.generateInvite(
        uuidv4(),
        INVITE_EXPIRATION_SECONDS,
        UNLIMITED_MAX_USES
    );

    const profileId = generated.profileId ?? (await wallet.invoke.getProfile())?.profileId;

    if (!profileId) {
        throw new Error('Unable to resolve your profile to build an invite link');
    }

    return {
        url: buildInviteUrl(baseUrl, generated.challenge, profileId),
        challenge: generated.challenge,
        profileId,
        expiresIn: generated.expiresIn,
    };
};

/**
 * The current user's reusable invite link.
 *
 * Disabled by default and deliberately so: `listInvites` is backed by a Redis
 * `KEYS` glob on the server, which is a scan. Enable it only where invite UI is
 * actually on screen — the contacts empty state (which renders for
 * zero-contact users only) or a tapped Invite button.
 */
export const useInviteLink = ({
    enabled = false,
}: { enabled?: boolean } = {}): UseQueryResult<InviteLink> => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<InviteLink>({
        queryKey: ['inviteLink', switchedDid ?? ''],
        enabled,
        // The link lives 30 days; there is no reason to re-resolve it in a session.
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
        retry: 1,
        queryFn: async () => {
            const wallet = await initWallet();

            return resolveInviteLink(wallet as unknown as InviteCapableWallet, getAppBaseUrl());
        },
    });
};
