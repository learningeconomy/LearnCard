import { randomBytes } from 'node:crypto';
import cache from '@cache';

export interface LoginTicketPayload {
    subject: string;
    email?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    name?: string;
    picture?: string;
    identityKey: string;
}

export const issueLoginTicket = async (payload: LoginTicketPayload): Promise<string> => {
    const ticket = randomBytes(32).toString('base64url');
    await cache.set(`login-ticket:${ticket}`, JSON.stringify(payload), 60);
    return ticket;
};

export const redeemLoginTicket = async (ticket: string): Promise<LoginTicketPayload | null> => {
    const redis = cache.redis ?? cache.node;
    const raw = await redis.getdel(`login-ticket:${ticket}`);
    return raw ? (JSON.parse(raw) as LoginTicketPayload) : null;
};
