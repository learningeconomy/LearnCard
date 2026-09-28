// Display-vocabulary layer.
//
// See docs/ARCHITECTURE.md ("Display vocabulary", 2026-09-21): "Domain identifiers,
// graph labels, tRPC procedures, and ADR text keep their domain terms. UI copy and
// partner-facing docs use display terms, mapped via one file in the console
// (apps/learn-cloud-console/src/lib/labels.ts)." — this is that file.
//
// Domain term            -> Display term            (definition anchor)
// -------------------------------------------------------------------------------
// Ecosystem (root)       -> Ecosystem                (ADR-001)
// Ecosystem (child,
//   Ecosystem--CHILD_OF-->Ecosystem)
//                         -> Group                    (ADR-001)
// Group (ADR-001 D11 curated collection: geographic /
//   administrative / programmatic / functional /
//   cohort / custom)     -> Network                   (ADR-001)
// external network        -> Federation / Federation   (ADR-014)
//                            partner
// IdP/SSO group claim     -> Directory group           (ADR-001)
// Institution / Employer / Member / roles
//   (OWNER / ADMIN / MEMBER / VIEWER)                  -> unchanged
//
// Do NOT rename the underlying `Ecosystem`/`Group` types, `ecosystem.*`/`group.*`
// tRPC procedures, route paths (`/ecosystem`, `/group/:id`, ...), or any other
// domain identifier to match this vocabulary — only the strings below (and any
// JSX text sourced from them) may say "Group" / "Network" / "Federation" / etc.
// New user-facing copy that names one of these primitives should add a key here
// instead of hard-coding the display term inline.

export const LABELS = {
    // --- Nouns (singular / plural) --------------------------------------------
    ecosystem: 'Ecosystem',
    ecosystems: 'Ecosystems',
    group: 'Group', // display term for a Child Ecosystem (CHILD_OF)
    groups: 'Groups',
    network: 'Network', // display term for a Group (ADR-001 D11 curated collection)
    networks: 'Networks',
    federation: 'Federation', // display term for an ADR-014 external network
    federationPartner: 'Federation partner',
    directoryGroup: 'Directory group', // display term for an IdP/SSO group claim
    institution: 'Institution',
    employer: 'Employer',
    member: 'Member',
    members: 'Members',

    // --- Ecosystem page (src/pages/Ecosystem.tsx) -----------------------------
    yourEcosystem: 'Your Ecosystem',
    yourEcosystemSubtitle: 'Your full ecosystem, filtered to only what you have permission to see.',
    addGroup: 'Add Group', // creates a Child Ecosystem
    addNetwork: 'Add Network', // creates a Group (ADR-001 D11)
    addEmployer: 'Add Employer',
    addInstitution: 'Add Institution',
    searchEcosystemPlaceholder: 'Search ecosystem...',
    ecosystemEmptyTitle: 'Your ecosystem is empty',
    emptyEcosystemHint: 'Add groups, networks, institutions, or employers to build your ecosystem.',

    // --- Ecosystem / Group detail pages (shared vocabulary) ------------------
    backToEcosystem: 'Back to Ecosystem',
    addMembers: 'Add Members',
    addMember: 'Add Member',
    noMembersInEcosystem: 'No members in this ecosystem yet.',
    noNetworkMembers: 'No members in this network yet.',
    noNetworksInEcosystem: 'No networks in this ecosystem yet.',
    childEcosystems: 'Groups', // heading for an Ecosystem's Child-Ecosystem list
    noChildEcosystems: 'No groups yet.',
    childNetworks: 'Child Networks', // heading for a Group's own child-Group list
    noChildNetworks: 'No child networks yet.',
    inheritedAdmins: 'Inherited admins', // ADR-001 D7: authority inherited down the Ecosystem axis from a parent

    // --- Add-entity dialog (src/components/ecosystem/AddEntityDialog.tsx) ----
    assignToNetworks: 'Assign to Networks',
    noNetworksYet: 'No networks yet.',
    createNetworkPlaceholder: 'Create new network…',
    ownerEcosystem: 'Owner Ecosystem',
    parentEcosystem: 'Parent Ecosystem',
    createGroup: 'Create Group', // submit button for the Child-Ecosystem creation form
    hierarchy: 'Hierarchy',
    root: 'Root',
    below: (n: number) => `${n} below`,
} as const;

export type EntityKind = 'ecosystem' | 'group' | 'institution' | 'employer';

/**
 * Display label for an entity `kind` discriminant (as used e.g. by
 * `UnifiedEntity.kind` in Ecosystem.tsx / EcosystemMapDialog.tsx).
 *
 * NOTE: `kind: 'group'` here is the Group (ADR-001 D11 curated collection)
 * primitive, which displays as "Network" — it is NOT the Child-Ecosystem
 * "Group" display term. For an `'ecosystem'` kind that is known to be a
 * Child Ecosystem (not the tenant root), use `ecosystemDisplayLabel(false)`
 * instead of this helper.
 */
export function entityKindLabel(
    kind: EntityKind
): 'Ecosystem' | 'Network' | 'Institution' | 'Employer' {
    switch (kind) {
        case 'ecosystem':
            return LABELS.ecosystem;
        case 'group':
            return LABELS.network;
        case 'institution':
            return LABELS.institution;
        case 'employer':
            return LABELS.employer;
    }
}

/**
 * Display label for an Ecosystem node: "Ecosystem" for the single per-tenant
 * root, "Group" for every Ecosystem --CHILD_OF--> Ecosystem descendant.
 */
export function ecosystemDisplayLabel(isRoot: boolean): 'Ecosystem' | 'Group' {
    return isRoot ? LABELS.ecosystem : LABELS.group;
}
