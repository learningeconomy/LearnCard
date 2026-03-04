# Skill Frameworks & OpenSALT

LearnCard Network supports both:

-   locally managed skill frameworks (created directly in LearnCard), and
-   provider-backed frameworks from OpenSALT (linked by CASE/OpenSALT reference).

This lets you mix custom frameworks with public standards in the same workflow.

## Link an OpenSALT Framework

Use `createSkillFramework` with a framework reference. The reference can be:

-   a CASE/OpenSALT framework URL (`/ims/case/v1p0/CFDocuments/...`),
-   an OpenSALT URI (`/uri/p...`), or
-   a raw framework UUID.

```typescript
const linked = await learnCard.invoke.createSkillFramework({
    frameworkId:
        'https://opensalt.net/ims/case/v1p0/CFDocuments/c6085394-d7cb-11e8-824f-0242ac160002',
});

// linked => { id, name, description, sourceURI, isPublic, ... }
```

After linking, sync skills into LearnCard for local browsing/search:

```typescript
await learnCard.invoke.syncFrameworkSkills({ id: linked.id });
```

## List Frameworks Available to the Current Profile

Use `getAllAvailableFrameworks` to retrieve frameworks the caller can use:

-   frameworks they manage, and
-   frameworks marked public (including linked OpenSALT frameworks).

```typescript
const page = await learnCard.invoke.getAllAvailableFrameworks({
    limit: 50,
    cursor: null,
    query: { name: { $regex: /math|ela/i } },
});

// page => { records, hasMore, cursor }
```

## Visibility Model

-   Managed frameworks default to `isPublic: false`.
-   OpenSALT-linked frameworks are stored as public (`isPublic: true`).
-   You can set visibility when creating/updating managed frameworks:

```typescript
await learnCard.invoke.createManagedSkillFramework({
    name: 'District Competencies',
    isPublic: true,
});

await learnCard.invoke.updateSkillFramework({
    id: 'framework-id',
    isPublic: false,
});
```

## Use OpenSALT Skills in Boosts

Once linked and synced, OpenSALT skills can be attached to Boosts like any other framework skill:

```typescript
const boostUri = await learnCard.invoke.createBoost(unsignedBoost, {
    skills: [{ frameworkId: linked.id, id: 'skill-id' }],
});

await learnCard.invoke.alignBoostSkills(boostUri, [{ frameworkId: linked.id, id: 'skill-id' }]);
```

When the credential is issued, LearnCard builds OBv3 alignment entries from the framework data so aligned skills are included in VC alignment fields.

## Network Operator Notes

If you run your own LearnCard Network deployment, OpenSALT provider behavior can be configured with:

-   `OPENSALT_BASE_URL` (defaults to `https://opensalt.net`)
-   `SKILLS_PROVIDER_API_KEY` (optional API key header)
