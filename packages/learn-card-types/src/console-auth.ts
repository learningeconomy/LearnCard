import type {} from 'zod-openapi';
import { z } from 'zod/v4';

import { EcosystemRoleEnum } from './ecosystem';

// The `AuthProvider` interface in ./auth is the wallet/SDK-side session abstraction
// (Firebase/Supertokens). The console-bff auth platform below is a distinct concern and
// must not be conflated with it; the behavioral provider interface lives in console-bff.

export const AuthProviderKindEnum = z.enum(['auth-coordinator', 'oidc', 'saml']);
export type AuthProviderKind = z.infer<typeof AuthProviderKindEnum>;

export const AssuranceLevelEnum = z.enum(['standard', 'mfa']);
export type AssuranceLevel = z.infer<typeof AssuranceLevelEnum>;

export const ProvisioningSourceEnum = z.enum(['JIT', 'IMPORT', 'ADMIN']);
export type ProvisioningSource = z.infer<typeof ProvisioningSourceEnum>;

export const BindingStatusEnum = z.enum(['ACTIVE', 'PENDING', 'REVOKED']);
export type BindingStatus = z.infer<typeof BindingStatusEnum>;

export const EcosystemRoleGrantValidator = z
    .object({
        ecosystemId: z.string().describe('Ecosystem the role applies to.'),
        role: EcosystemRoleEnum.describe('Role held within the Ecosystem.'),
    })
    .describe('A single Ecosystem-scoped role grant.');
export type EcosystemRoleGrant = z.infer<typeof EcosystemRoleGrantValidator>;

export const EffectiveAccessValidator = z
    .object({
        ecosystemRoles: z
            .array(EcosystemRoleGrantValidator)
            .default([])
            .describe('Ecosystem-scoped role grants compiled for the session subject.'),
        scopes: z
            .array(z.string())
            .default([])
            .describe('Flat OAuth-style scopes granted for this session.'),
    })
    .describe('Compiled access snapshot attached to a DashboardSession (ADR-001 §3.9).');
export type EffectiveAccess = z.infer<typeof EffectiveAccessValidator>;

export const DashboardSessionValidator = z
    .object({
        sessionId: z.string().describe('Opaque session identifier carried in the httpOnly cookie.'),
        tenantId: z.string().describe('Tenant that owns this session.'),
        providerId: z.string().describe('AuthProvider instance that authenticated the subject.'),
        providerKind: AuthProviderKindEnum.describe(
            'Protocol family of the authenticating provider.'
        ),
        externalSubject: z
            .string()
            .describe('Immutable IdP subject (OIDC iss+sub / SAML NameID) for this session.'),
        profileId: z.string().describe('Resolved managed Profile ID for the subject.'),
        managedDid: z.string().describe('Server-managed did:web bound to the Profile.'),
        linkedWalletProfileId: z
            .string()
            .optional()
            .describe(
                'Optional linked personal wallet Profile ID (never impersonable by the tenant).'
            ),
        activeEcosystemId: z
            .string()
            .optional()
            .describe('Ecosystem the dashboard is currently scoped to.'),
        effectiveAccess: EffectiveAccessValidator.describe('Compiled access for this session.'),
        authTime: z.string().describe('ISO 8601 time the subject authenticated.'),
        expiresAt: z.string().describe('ISO 8601 session expiry.'),
        assuranceLevel: AssuranceLevelEnum.describe(
            'Authentication assurance level (MFA vs standard).'
        ),
    })
    .describe('Server-side dashboard session state (ADR-001 §3.9).');
export type DashboardSession = z.infer<typeof DashboardSessionValidator>;

export const ExternalIdentityBindingValidator = z
    .object({
        tenantId: z.string().describe('Tenant that owns the binding.'),
        ecosystemId: z.string().describe('Ecosystem the subject is provisioned into.'),
        providerId: z.string().describe('AuthProvider instance that produced the binding.'),
        issuer: z
            .string()
            .describe('IdP issuer, e.g. https://login.microsoftonline.com/<tenant>/v2.0.'),
        subject: z.string().describe('Immutable IdP subject — primary match key. Never the email.'),
        email: z.string().optional().describe('Email claim (mutable — NOT a match key).'),
        employeeId: z.string().optional().describe('Optional secondary match key.'),
        profileId: z.string().describe('Managed Profile ID mapped from this identity.'),
        managedDid: z.string().describe('Server-managed did:web for the Profile.'),
        provisioningSource: ProvisioningSourceEnum.describe('How the binding was created.'),
        status: BindingStatusEnum.describe('Binding lifecycle status.'),
        createdAt: z.string().describe('ISO 8601 creation timestamp.'),
        lastLoginAt: z
            .string()
            .optional()
            .describe('ISO 8601 timestamp of the last successful login.'),
    })
    .describe('SSO → managed Profile binding (ADR-001 §3.10).');
export type ExternalIdentityBinding = z.infer<typeof ExternalIdentityBindingValidator>;

export const ExternalIdentityValidator = z
    .object({
        issuer: z.string().describe('IdP issuer that asserted the identity.'),
        subject: z.string().describe('Immutable IdP subject.'),
        email: z.string().optional().describe('Asserted email claim.'),
        emailVerified: z
            .boolean()
            .optional()
            .describe('Whether the IdP marked the email verified.'),
        displayName: z.string().optional().describe('Asserted display name.'),
        employeeId: z.string().optional().describe('Asserted employee/staff identifier.'),
        groups: z
            .array(z.string())
            .optional()
            .describe('IdP group claims used for role mapping via TenantAuthPolicy.groupMappings.'),
        assuranceLevel: AssuranceLevelEnum.optional().describe(
            'Assurance level derived from acr/AuthnContext.'
        ),
    })
    .describe(
        'Transient identity asserted by an IdP during a login callback (never persisted as-is).'
    );
export type ExternalIdentity = z.infer<typeof ExternalIdentityValidator>;

// OWNER/ADMIN are intentionally excluded: JIT/import flows must never grant
// administrative access (ADR-001 §3.10 JIT flow step 4c).
export const ProvisionableRoleEnum = z.enum(['MEMBER', 'VIEWER']);
export type ProvisionableRole = z.infer<typeof ProvisionableRoleEnum>;

export const OidcProviderConfigValidator = z
    .object({
        issuer: z.string().describe('OIDC issuer URL (used for discovery + JWKS).'),
        clientId: z.string().describe('OIDC client ID registered with the IdP.'),
        audience: z.string().optional().describe('Expected token audience (defaults to clientId).'),
        scopes: z
            .array(z.string())
            .default(['openid', 'email', 'profile'])
            .describe('Requested OIDC scopes.'),
        emailClaim: z.string().default('email').describe('Claim carrying the email.'),
        emailVerifiedClaim: z
            .string()
            .default('email_verified')
            .describe('Claim carrying email-verified state.'),
        groupsClaim: z.string().optional().describe('Claim carrying group memberships.'),
    })
    .describe('OIDC provider configuration for a tenant.');
export type OidcProviderConfig = z.infer<typeof OidcProviderConfigValidator>;

export const AuthProviderConfigValidator = z
    .object({
        providerId: z
            .string()
            .describe('Stable identifier for this provider instance within the tenant.'),
        kind: AuthProviderKindEnum.describe('Protocol family of the provider.'),
        displayName: z
            .string()
            .optional()
            .describe('Human-facing provider name shown on the login page.'),
        enabled: z.boolean().default(true).describe('Whether the provider accepts new logins.'),
        oidc: OidcProviderConfigValidator.optional().describe('OIDC config when kind = oidc.'),
    })
    .describe('A single auth provider a tenant exposes (ADR-001 §3.9).');
export type AuthProviderConfig = z.infer<typeof AuthProviderConfigValidator>;

export const GroupRoleMappingValidator = z
    .object({
        idpGroup: z.string().describe('Group value asserted by the IdP.'),
        ecosystemId: z.string().describe('Ecosystem the mapped role applies to.'),
        role: EcosystemRoleEnum.describe('Ecosystem role granted to members of the IdP group.'),
    })
    .describe('Maps an IdP group claim to an Ecosystem role.');
export type GroupRoleMapping = z.infer<typeof GroupRoleMappingValidator>;

export const TenantAuthPolicyValidator = z
    .object({
        tenantId: z.string().describe('Tenant this policy governs.'),
        rootEcosystemId: z
            .string()
            .describe(
                'Shadow/root Ecosystem newly provisioned subjects are attached to by default.'
            ),
        providers: z
            .array(AuthProviderConfigValidator)
            .default([])
            .describe('Auth providers this tenant exposes.'),
        allowJit: z
            .boolean()
            .default(false)
            .describe('Whether unknown-but-authenticated subjects are JIT-provisioned.'),
        defaultRole: ProvisionableRoleEnum.default('VIEWER').describe(
            'Role granted to JIT/imported subjects. Never OWNER/ADMIN.'
        ),
        groupMappings: z
            .array(GroupRoleMappingValidator)
            .default([])
            .describe('IdP-group → Ecosystem-role mappings applied at login.'),
        sessionTtlSeconds: z
            .number()
            .int()
            .positive()
            .default(3600)
            .describe('Dashboard session lifetime in seconds (minimum enforced by the BFF).'),
        minAssuranceLevel: AssuranceLevelEnum.default('standard').describe(
            'Minimum assurance level required to establish a session.'
        ),
    })
    .describe('Per-tenant auth configuration and provisioning policy (ADR-001 §3.9–§3.10).');
export type TenantAuthPolicy = z.infer<typeof TenantAuthPolicyValidator>;
