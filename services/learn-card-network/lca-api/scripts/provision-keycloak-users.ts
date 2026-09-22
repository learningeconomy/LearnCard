import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { client } from '../src/mongo';
import { getUserKeysCollection } from '../src/models/UserKey';
import { getAuthSubjectsCollection, getOrCreateAuthSubject } from '../src/models/AuthSubject';
import { maskEmail } from '../src/helpers/maskEmail';
import { createKeycloakAdmin } from './keycloak-admin';

export interface ProvisionOptions {
    apply?: boolean;
    email?: string;
    limit?: number;
}
export interface ProvisionSummary {
    processed: number;
    skipped: number;
    refused: number;
    mapped: number;
    missingMappings: number;
}
const log = (message: string): void => {
    process.stdout.write(`${message}\n`);
};
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Offline operator migration, never a runtime email-based identity fallback. */
export const provisionKeycloakUsers = async (
    options: ProvisionOptions = {}
): Promise<ProvisionSummary> => {
    const email =
        options.email === undefined
            ? undefined
            : z.email().parse(options.email.trim().toLowerCase());
    const limit =
        options.limit === undefined ? undefined : z.number().int().positive().parse(options.limit);
    const admin = await createKeycloakAdmin();
    const keys = getUserKeysCollection();
    const subjects = getAuthSubjectsCollection();
    const summary: ProvisionSummary = {
        processed: 0,
        skipped: 0,
        refused: 0,
        mapped: 0,
        missingMappings: 0,
    };
    const cursor = keys
        .find({
            'authProviders.type': 'firebase',
            ...(email
                ? {
                      'contactMethod.type': 'email',
                      'contactMethod.value': { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
                  }
                : {}),
        })
        .sort({ _id: 1 });
    if (limit) cursor.limit(limit);
    log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN (no resource writes)'}\nContact\tResult`);
    for await (const key of cursor) {
        summary.processed++;
        if (key.contactMethod.type !== 'email') {
            summary.skipped++;
            log('[phone-only]\tSKIP: phone OTP deferred');
            continue;
        }
        const normalized = key.contactMethod.value.trim().toLowerCase();
        const label = maskEmail(normalized);
        const refuse = (reason: string): void => {
            summary.refused++;
            log(`${label}\tREFUSED: ${reason}`);
        };
        if (!z.email().safeParse(normalized).success) {
            refuse('invalid email');
            continue;
        }
        // Contact indexes are deliberately nonunique; recycled/ambiguous addresses need manual review.
        const peers = await keys.countDocuments({
            'contactMethod.type': 'email',
            'contactMethod.value': {
                $regex: `^\\s*${escapeRegex(normalized)}\\s*$`,
                $options: 'i',
            },
        });
        if (peers !== 1) {
            refuse('ambiguous UserKey email; manual identity review required');
            continue;
        }
        const identityKey = `email:${normalized}`;
        let subject = await subjects.findOne({ identityKey });
        const matches = await admin.findUsers(normalized);
        if (matches.length > 1) {
            refuse('ambiguous Keycloak email');
            continue;
        }
        let user = matches[0];
        if (
            user &&
            (user.email?.toLowerCase() !== normalized || !user.enabled || !user.emailVerified)
        ) {
            refuse('existing Keycloak user is disabled or email is not verified');
            continue;
        }
        const links = user ? await admin.links(user.id) : [];
        const link = links.find(item => item.identityProvider === 'lca-api');
        if (link && link.userId !== subject?.subject) {
            refuse('existing lca-api link differs');
            continue;
        }
        const mappings = key.authProviders.filter(provider => provider.type === 'keycloak');
        if (mappings.some(mapping => mapping.id !== user?.id)) {
            refuse('existing keycloak mapping differs');
            continue;
        }
        if (
            user &&
            (await keys.findOne({
                _id: { $ne: key._id },
                authProviders: { $elemMatch: { type: 'keycloak', id: user.id } },
            }))
        ) {
            refuse('Keycloak identity already belongs to another UserKey');
            continue;
        }
        const actions = [
            !subject && 'create subject',
            !user && 'create user',
            !link && 'link lca-api',
            !mappings.length && 'append mapping',
        ].filter(Boolean);
        if (!options.apply) {
            log(`${label}\t${actions.length ? `PLAN: ${actions.join(', ')}` : 'unchanged'}`);
            continue;
        }
        // Do not call getOrCreate for an existing subject: it updates lastLoginAt.
        subject ??= await getOrCreateAuthSubject(identityKey, {
            email: normalized,
            emailVerified: true,
        });
        if (!user) {
            const phone = z
                .object({ phone: z.string().optional(), phoneNumber: z.string().optional() })
                .parse(key);
            const number = phone.phone ?? phone.phoneNumber;
            await admin.request('/users', {
                method: 'POST',
                body: JSON.stringify({
                    username: normalized,
                    email: normalized,
                    emailVerified: true,
                    enabled: true,
                    ...(number
                        ? {
                              attributes: {
                                  phone_number: [number],
                                  // UserKey has no canonical secondary-phone verification proof.
                                  // Never promote a legacy string into a verified identity claim.
                                  phone_number_verified: ['false'],
                              },
                          }
                        : {}),
                }),
            });
            const created = await admin.findUsers(normalized);
            if (created.length !== 1) throw new Error('Cannot resolve newly provisioned user');
            user = created[0]!;
        }
        if (!link)
            await admin.request(
                `/users/${encodeURIComponent(user.id)}/federated-identity/lca-api`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        identityProvider: 'lca-api',
                        userId: subject.subject,
                        userName: subject.subject,
                    }),
                }
            );
        if (!mappings.length) {
            const result = await keys.updateOne(
                { _id: key._id, authProviders: { $not: { $elemMatch: { type: 'keycloak' } } } },
                {
                    $addToSet: { authProviders: { type: 'keycloak', id: user.id } },
                }
            );
            if (result.modifiedCount !== 1)
                throw new Error('Concurrent mapping change; rerun after review');
            summary.mapped++;
        }
        log(`${label}\t${actions.length ? actions.join(', ') : 'unchanged'}`);
    }
    summary.missingMappings = await keys.countDocuments({
        'contactMethod.type': 'email',
        'authProviders.type': { $ne: 'keycloak' },
    });
    log(`Summary: ${JSON.stringify(summary)}`);
    log(
        `Mapping-presence assertion: ${summary.missingMappings === 0 && summary.refused === 0 ? 'PASS' : 'FAIL'} — ${summary.missingMappings} email UserKeys lack a keycloak mapping (global, not limited by --email/--limit).`
    );
    log(
        'Cutover approval: NOT EVALUATED. Presence is necessary, not sufficient; validate all existing mappings and authoritative Firebase UID ownership before cutover.'
    );
    return summary;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        const { values } = parseArgs({
            args: process.argv.slice(2).filter(arg => arg !== '--'),
            options: {
                apply: { type: 'boolean', default: false },
                email: { type: 'string' },
                limit: { type: 'string' },
            },
            strict: true,
        });
        const summary = await provisionKeycloakUsers({
            apply: values.apply,
            email: values.email,
            limit: values.limit === undefined ? undefined : Number(values.limit),
        });
        if (summary.refused) process.exitCode = 1;
    } catch {
        process.stderr.write(
            'Provisioning failed. Check arguments, service connectivity and admin permissions; rerun the dry-run before applying.\n'
        );
        process.exitCode = 1;
    } finally {
        await client.close();
    }
}
