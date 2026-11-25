/**
 * Reserved, undeliverable email addresses for ClassLink Firebase users whose school
 * email is not trusted (domain not on the district's `allowedEmailDomains`) or absent.
 *
 * Wallet key storage (`keys.*`) identifies a user by an email or phone contact method,
 * so a ClassLink student without a trusted email gets `<uid>@users.classlink.invalid`
 * on their Firebase user (`emailVerified: false`). `.invalid` is reserved by RFC 2606
 * and can never resolve, so nothing can be delivered to it and no one can register it.
 *
 * The address is an internal account handle only. It must never be used as a real
 * contact: no mail is sent to it, email-code sign-in refuses it, Keycloak provisioning
 * never makes it a verified email or an `email:` AuthSubject, and `ClassLinkIdentity.email`
 * keeps the real school email (or nothing).
 */

/** Reserved domain for synthetic ClassLink account addresses. */
export const SYNTHETIC_EMAIL_DOMAIN = 'users.classlink.invalid';

/** The synthetic address for a Firebase uid (lowercased, as Firebase stores emails). */
export const syntheticEmailForUid = (uid: string): string =>
    `${uid.trim().toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;

/** True for any address on the reserved synthetic domain (case- and whitespace-insensitive). */
export const isSyntheticEmail = (email: string | null | undefined): boolean =>
    typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);
