import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { ObjectId, type Collection } from 'mongodb';
import { client } from '../src/mongo';
import { getUserKeysCollection, type MongoUserKeyType } from '../src/models/UserKey';
import { getAuthSubjectsCollection, getOrCreateAuthSubject } from '../src/models/AuthSubject';
import { maskEmail } from '../src/helpers/maskEmail';
import { createKeycloakAdmin } from './keycloak-admin';
import { setTimeout } from 'node:timers/promises';
import {
    fetchFirebaseUsers,
    linkFirebaseProviders,
    type FirebaseReader,
    type FirebaseUser,
    type ProviderLinkSummary,
} from './keycloak-provider-links';

export interface ProvisionOptions {
    apply?: boolean;
    email?: string;
    limit?: number;
    after?: string;
    linkProviders?: boolean;
}
export interface ProvisionSummary extends ProviderLinkSummary {
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

type ProvisionKey = Omit<MongoUserKeyType, '_id'> & { _id: ObjectId };

const loadProvisioningBatch = async (
    source: AsyncIterator<ProvisionKey>,
    firebase?: FirebaseReader
): Promise<{ batch: ProvisionKey[]; firebaseUsers?: Map<string, FirebaseUser> }> => {
    const batch: ProvisionKey[] = [];
    for (let index = 0; index < (firebase ? 100 : 1); index++) {
        const item = await source.next();
        if (item.done) break;
        batch.push(item.value);
    }
    const firebaseUsers =
        firebase && batch.length
            ? await fetchFirebaseUsers(
                  batch.flatMap(key =>
                      key.authProviders
                          .filter(provider => provider.type === 'firebase')
                          .map(provider => provider.id)
                  ),
                  firebase
              )
            : undefined;
    return { batch, firebaseUsers };
};

const getFirebaseReader = async (): Promise<FirebaseReader> => {
    const { environment } = await import('../src/config/environment');
    // Validate before importing the legacy initializer, which logs raw JSON parse errors.
    try {
        z.object({})
            .passthrough()
            .parse(JSON.parse(environment.GOOGLE_APPLICATION_CREDENTIAL ?? ''));
    } catch {
        throw new Error('Valid existing Firebase Admin credential JSON is required');
    }
    const { default: app } = await import('../src/firebase');
    if (!app)
        throw new Error('Existing Firebase Admin credentials are required for provider linking');
    return app.auth();
};

/** Offline operator migration, never a runtime email-based identity fallback. */
export const provisionKeycloakUsers = async (
    options: ProvisionOptions = {},
    dependencies: {
        firebase?: FirebaseReader;
        admin?: Awaited<ReturnType<typeof createKeycloakAdmin>>;
    } = {}
): Promise<ProvisionSummary> => {
    const email =
        options.email === undefined
            ? undefined
            : z.email().parse(options.email.trim().toLowerCase());
    const limit =
        options.limit === undefined ? undefined : z.number().int().positive().parse(options.limit);
    const after =
        options.after === undefined
            ? undefined
            : new ObjectId(
                  z
                      .string()
                      .regex(/^[0-9a-fA-F]{24}$/)
                      .parse(options.after)
              );
    let lastProcessedId = after?.toHexString();
    const summary: ProvisionSummary = {
        processed: 0,
        skipped: 0,
        refused: 0,
        mapped: 0,
        missingMappings: 0,
        linked: 0,
        alreadyLinked: 0,
        conflicts: 0,
        noSocialProvider: 0,
        wouldLink: 0,
    };
    try {
        const linkProviders = options.linkProviders ?? true;
        const firebase = linkProviders
            ? (dependencies.firebase ?? (await getFirebaseReader()))
            : undefined;
        const admin = dependencies.admin ?? (await createKeycloakAdmin());
        // Mongo assigns ObjectIds on insert; the model's optional string _id describes serialized data.
        const keys = getUserKeysCollection() as unknown as Collection<
            Omit<MongoUserKeyType, '_id'>
        >;
        const subjects = getAuthSubjectsCollection();
        const cursor = keys
            .find({
                'authProviders.type': 'firebase',
                ...(after ? { _id: { $gt: after } } : {}),
                ...(email
                    ? {
                          'contactMethod.type': 'email',
                          'contactMethod.value': {
                              $regex: `^${escapeRegex(email)}$`,
                              $options: 'i',
                          },
                      }
                    : {}),
            })
            .sort({ _id: 1 });
        if (limit) cursor.limit(limit);
        log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN (no resource writes)'}\nContact\tResult`);
        const iterator = cursor[Symbol.asyncIterator]();
        try {
            while (true) {
                const { batch, firebaseUsers } = await loadProvisioningBatch(iterator, firebase);
                if (!batch.length) break;
                for (const key of batch) {
                    let failed = false;
                    try {
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
                        const firebaseIds = key.authProviders
                            .filter(provider => provider.type === 'firebase')
                            .map(provider => provider.id);
                        const firebaseRecords = firebaseIds.map(id => firebaseUsers?.get(id));
                        if (
                            linkProviders &&
                            (!firebaseIds.length ||
                                firebaseRecords.some(
                                    record =>
                                        !record ||
                                        record.disabled ||
                                        !record.emailVerified ||
                                        record.email?.trim().toLowerCase() !== normalized
                                ))
                        ) {
                            refuse(
                                'Firebase UID missing, disabled, unverified, or email ownership differs'
                            );
                            continue;
                        }
                        const linkSocial = async (userId?: string): Promise<void> => {
                            if (!linkProviders) return;
                            await linkFirebaseProviders({
                                userId,
                                providers: firebaseRecords.flatMap(
                                    record => record?.providerData ?? []
                                ),
                                apply: options.apply ?? false,
                                admin,
                                log: message => log(`${label}\t${message}`),
                                summary,
                            });
                        };
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
                            (user.email?.toLowerCase() !== normalized ||
                                !user.enabled ||
                                !user.emailVerified)
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
                        const mappings = key.authProviders.filter(
                            provider => provider.type === 'keycloak'
                        );
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
                            log(
                                `${label}\t${actions.length ? `PLAN: ${actions.join(', ')}` : 'unchanged'}`
                            );
                            await linkSocial(user?.id);
                            continue;
                        }
                        // Do not call getOrCreate for an existing subject: it updates lastLoginAt.
                        subject ??= await getOrCreateAuthSubject(identityKey, {
                            email: normalized,
                            emailVerified: true,
                        });
                        if (!user) {
                            const phone = z
                                .object({
                                    phone: z.string().optional(),
                                    phoneNumber: z.string().optional(),
                                })
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
                            if (created.length !== 1)
                                throw new Error('Cannot resolve newly provisioned user');
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
                                {
                                    _id: key._id,
                                    authProviders: { $not: { $elemMatch: { type: 'keycloak' } } },
                                },
                                {
                                    $addToSet: { authProviders: { type: 'keycloak', id: user.id } },
                                }
                            );
                            if (result.modifiedCount !== 1)
                                throw new Error('Concurrent mapping change; rerun after review');
                            summary.mapped++;
                        }
                        await linkSocial(user.id);
                        log(`${label}\t${actions.length ? actions.join(', ') : 'unchanged'}`);
                    } catch (error) {
                        failed = true;
                        throw error;
                    } finally {
                        if (!failed) {
                            lastProcessedId = key._id.toHexString();
                            if (summary.processed % 100 === 0)
                                log(`Last processed id: ${lastProcessedId}`);
                        }
                    }
                }
                if (firebase && batch.length === 100) await setTimeout(1000);
            }
        } finally {
            await iterator.return?.();
        }
        summary.missingMappings = await keys.countDocuments({
            'contactMethod.type': 'email',
            'authProviders.type': { $ne: 'keycloak' },
        });
        log(
            `Mapping-presence assertion: ${summary.missingMappings === 0 && summary.refused === 0 ? 'PASS' : 'FAIL'} — ${summary.missingMappings} email UserKeys lack a keycloak mapping (global, not limited by --email/--limit).`
        );
        log(
            'Cutover approval: NOT EVALUATED. Presence is necessary, not sufficient; validate all existing mappings and authoritative Firebase UID ownership before cutover.'
        );
        return summary;
    } finally {
        log(`Summary: ${JSON.stringify(summary)}`);
        log(
            `Last processed id: ${lastProcessedId ?? '(none)'}${lastProcessedId ? `; resume with --after ${lastProcessedId}` : ''}`
        );
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        const { values } = parseArgs({
            args: process.argv.slice(2).filter(arg => arg !== '--'),
            options: {
                apply: { type: 'boolean', default: false },
                email: { type: 'string' },
                limit: { type: 'string' },
                after: { type: 'string' },
                'link-providers': { type: 'boolean', default: true },
            },
            allowNegative: true,
            strict: true,
        });
        const summary = await provisionKeycloakUsers({
            apply: values.apply,
            email: values.email,
            after: values.after,
            linkProviders: values['link-providers'],
            limit: values.limit === undefined ? undefined : Number(values.limit),
        });
        if (summary.refused || summary.conflicts) process.exitCode = 1;
    } catch (error) {
        // Argument errors are safe to echo; driver/HTTP errors can embed connection
        // strings or credentials, so only their type is shown.
        const code = (error as { code?: unknown }).code;
        const detail =
            typeof code === 'string' && code.startsWith('ERR_PARSE_ARGS') && error instanceof Error
                ? error.message
                : `${error instanceof Error ? error.name : typeof error}${
                      typeof code === 'string' ? ` (${code})` : ''
                  }`;
        process.stderr.write(
            `Provisioning failed: ${detail}\nCheck arguments, service connectivity and admin permissions; rerun the dry-run before applying.\n`
        );
        process.exitCode = 1;
    } finally {
        await client.close();
    }
}
