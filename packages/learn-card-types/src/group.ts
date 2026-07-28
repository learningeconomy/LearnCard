import type {} from 'zod-openapi';
import { z } from 'zod/v4';

import { SLUG_REGEX, EcosystemStatusEnum } from './ecosystem';

export const GroupTypeEnum = z.enum([
    'geographic',
    'administrative',
    'programmatic',
    'functional',
    'cohort',
    'custom',
]);
export type GroupType = z.infer<typeof GroupTypeEnum>;

export const GroupMembershipModeEnum = z.enum(['EXPLICIT', 'COMPUTED']);
export type GroupMembershipMode = z.infer<typeof GroupMembershipModeEnum>;

export const GroupReferenceModeEnum = z.enum(['SUMMARY', 'ROSTER']);
export type GroupReferenceMode = z.infer<typeof GroupReferenceModeEnum>;

export const GroupMembershipProvenanceEnum = z.enum(['MANUAL', 'IMPORTED', 'COMPUTED']);
export type GroupMembershipProvenance = z.infer<typeof GroupMembershipProvenanceEnum>;

export const GroupValidator = z.object({
    id: z.string().describe('Unique Group identifier. Format: grp_<uuid>.'),
    name: z.string().describe('Human-readable Group name.'),
    slug: z
        .string()
        .regex(SLUG_REGEX)
        .describe('URL-safe slug, unique among siblings under the same parent Group.'),
    type: GroupTypeEnum.describe('Curated-collection taxonomy type (ADR-001 D11).'),
    description: z.string().optional().describe('Optional Group description.'),

    parentGroupId: z
        .string()
        .nullable()
        .describe('Parent Group ID for the strict single-parent tree, or null for a root Group.'),
    pathIds: z.array(z.string()).describe('Cached root-to-self ID array for O(1) ancestor checks.'),
    depth: z.number().int().nonnegative().describe('Cached tree depth.'),
    rootGroupId: z.string().describe('Cached root Group ID.'),

    ownerEcosystemId: z
        .string()
        .describe(
            'Ecosystem that exclusively owns this Group (ADR-001 D12 rule 1 — singular ownership).'
        ),

    identityProfileId: z
        .string()
        .optional()
        .describe(
            'Optional managed Profile ID when the Group acts as a credential issuer (HAS_IDENTITY, 1:1).'
        ),
    identityIssuanceEnabled: z
        .boolean()
        .optional()
        .describe(
            'Whether the currently attached managed issuer identity may issue new credentials. Defaults to true when an identity is attached.'
        ),

    membershipMode: GroupMembershipModeEnum.default('EXPLICIT').describe(
        'EXPLICIT: edges are source of truth. COMPUTED: edges materialized from computedCriteria.'
    ),
    computedCriteria: z
        .unknown()
        .optional()
        .describe('Query expression present when membershipMode = COMPUTED.'),

    status: EcosystemStatusEnum.describe('Group lifecycle status.'),
    createdAt: z.string().describe('ISO 8601 creation timestamp.'),
    updatedAt: z.string().describe('ISO 8601 last-update timestamp.'),
});
export type Group = z.infer<typeof GroupValidator>;

export const CreateGroupInputValidator = GroupValidator.omit({
    id: true,
    pathIds: true,
    depth: true,
    rootGroupId: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    parentGroupId: z.string().nullable(),
});
export type CreateGroupInput = z.infer<typeof CreateGroupInputValidator>;

export const UpdateGroupInputValidator = z.object({
    id: z.string(),
    name: z.string().optional(),
    slug: z.string().regex(SLUG_REGEX).optional(),
    description: z.string().optional(),
    type: GroupTypeEnum.optional(),
    status: EcosystemStatusEnum.optional(),
});
export type UpdateGroupInput = z.infer<typeof UpdateGroupInputValidator>;

export const ArchiveGroupInputValidator = z.object({ id: z.string() });
export type ArchiveGroupInput = z.infer<typeof ArchiveGroupInputValidator>;

export const GroupMemberMutationInputValidator = z.object({
    id: z.string(),
    profileId: z.string(),
});
export type GroupMemberMutationInput = z.infer<typeof GroupMemberMutationInputValidator>;

export const MaterializeComputedGroupMembershipInputValidator = z.object({ id: z.string() });
export type MaterializeComputedGroupMembershipInput = z.infer<
    typeof MaterializeComputedGroupMembershipInputValidator
>;

export const MoveGroupInputValidator = z.object({
    id: z.string(),
    parentGroupId: z.string().nullable(),
});
export type MoveGroupInput = z.infer<typeof MoveGroupInputValidator>;

export const AttachGroupIdentityInputValidator = z.object({
    id: z.string(),
    identityProfileId: z.string(),
});
export type AttachGroupIdentityInput = z.infer<typeof AttachGroupIdentityInputValidator>;

export const DisableGroupIdentityIssuanceInputValidator = z.object({ id: z.string() });
export type DisableGroupIdentityIssuanceInput = z.infer<
    typeof DisableGroupIdentityIssuanceInputValidator
>;

export const DetachGroupIdentityInputValidator = z.object({ id: z.string() });
export type DetachGroupIdentityInput = z.infer<typeof DetachGroupIdentityInputValidator>;

export const TransferGroupOwnershipInputValidator = z.object({
    id: z.string(),
    targetEcosystemId: z.string(),
});
export type TransferGroupOwnershipInput = z.infer<typeof TransferGroupOwnershipInputValidator>;

export const GroupReferenceValidator = z.object({
    groupId: z.string().describe('Referenced Group ID.'),
    consumerEcosystemId: z
        .string()
        .describe('Ecosystem granted read-only visibility to the Group.'),
    mode: GroupReferenceModeEnum.describe(
        'SUMMARY = Group envelope only. ROSTER = envelope plus stable member Profile IDs.'
    ),
    grantedAt: z.string().describe('ISO 8601 grant timestamp.'),
    grantedByProfileId: z.string().describe('Profile ID of the owner-side grantor.'),
    expiresAt: z.string().nullable().describe('ISO 8601 expiry timestamp, or null for no expiry.'),
});
export type GroupReference = z.infer<typeof GroupReferenceValidator>;

export const GrantGroupReferenceInputValidator = z.object({
    id: z.string(),
    consumerEcosystemId: z.string(),
    mode: GroupReferenceModeEnum,
    expiresAt: z.string().nullable().optional(),
});
export type GrantGroupReferenceInput = z.infer<typeof GrantGroupReferenceInputValidator>;

export const RevokeGroupReferenceInputValidator = z.object({
    id: z.string(),
    consumerEcosystemId: z.string(),
});
export type RevokeGroupReferenceInput = z.infer<typeof RevokeGroupReferenceInputValidator>;

export const GroupReferenceViewValidator = z.object({
    group: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        type: GroupTypeEnum,
        description: z.string().optional(),
        status: EcosystemStatusEnum,
        ownerEcosystemId: z.string(),
    }),
    memberProfileIds: z.array(z.string()).optional(),
});
export type GroupReferenceView = z.infer<typeof GroupReferenceViewValidator>;

export const GroupQueryValidator = z
    .object({
        id: z.string(),
        slug: z.string(),
        type: GroupTypeEnum,
        parentGroupId: z.string().nullable(),
        rootGroupId: z.string(),
        ownerEcosystemId: z.string(),
        status: EcosystemStatusEnum,
    })
    .partial();
export type GroupQuery = z.infer<typeof GroupQueryValidator>;
