# learn-card-types

## 5.11.2

### Patch Changes

-   [#882](https://github.com/learningeconomy/LearnCard/pull/882) [`73865cc62ea292badb99fe41ca8b0f484a12728f`](https://github.com/learningeconomy/LearnCard/commit/73865cc62ea292badb99fe41ca8b0f484a12728f) Thanks [@Custard7](https://github.com/Custard7)! - feat: Unified Send

## 5.11.1

### Patch Changes

-   [#905](https://github.com/learningeconomy/LearnCard/pull/905) [`f8e50b1e3ceafccde28bef859b2c8b220acb2b7d`](https://github.com/learningeconomy/LearnCard/commit/f8e50b1e3ceafccde28bef859b2c8b220acb2b7d) Thanks [@Custard7](https://github.com/Custard7)! - feat: [LC-1103] Dynamic Boost Templates

## 5.11.0

### Minor Changes

-   [#895](https://github.com/learningeconomy/LearnCard/pull/895) [`bb6749d4cd123ca1fcee8d6f657861ae77a614a2`](https://github.com/learningeconomy/LearnCard/commit/bb6749d4cd123ca1fcee8d6f657861ae77a614a2) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add generic `send` method for ergonomic credential sending

    **Features:**

    -   New `send` method that auto-issues credentials from boost templates
    -   Supports client-side credential issuance when available, falls back to signing authority
    -   Contract-aware: automatically routes through consent flow when recipient has consented
    -   Creates `RELATED_TO` relationship between newly created boosts and contracts

    **Usage:**

    ```typescript
    // Send using existing boost template
    await lc.invoke.send({
        type: 'boost',
        recipient: 'userProfileId',
        templateUri: 'urn:lc:boost:...',
    });

    // Send by creating a new boost
    await lc.invoke.send({
        type: 'boost',
        recipient: 'userProfileId',
        template: { credential: unsignedVC },
        contractUri: 'urn:lc:contract:...', // optional
    });
    ```

### Patch Changes

-   [#898](https://github.com/learningeconomy/LearnCard/pull/898) [`3727c732ad54b4a8ccb89c6354291799e953c8ab`](https://github.com/learningeconomy/LearnCard/commit/3727c732ad54b4a8ccb89c6354291799e953c8ab) Thanks [@Custard7](https://github.com/Custard7)! - feat: Add Default Permissions to Boosts

## 5.10.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - feat: App Store CRUD & Partner Portal

## 5.9.2

### Patch Changes

-   [#824](https://github.com/learningeconomy/LearnCard/pull/824) [`cb518c2f15b8257eb07fa2c606f52dd3304bc9ea`](https://github.com/learningeconomy/LearnCard/commit/cb518c2f15b8257eb07fa2c606f52dd3304bc9ea) Thanks [@gerardopar](https://github.com/gerardopar)! - feat: LC-1310 - Add Evidence Support

## 5.9.1

### Patch Changes

-   [#851](https://github.com/learningeconomy/LearnCard/pull/851) [`a8ba030d48e75094fd64cd3da0725c3c0f468cf2`](https://github.com/learningeconomy/LearnCard/commit/a8ba030d48e75094fd64cd3da0725c3c0f468cf2) Thanks [@gerardopar](https://github.com/gerardopar)! - Add arbitrary metadata support when sending credentials that gets plumbed through to the notification payload

## 5.9.0

### Minor Changes

-   [#848](https://github.com/learningeconomy/LearnCard/pull/848) [`f56a417dc005623e793945e19808d6d9a9193357`](https://github.com/learningeconomy/LearnCard/commit/f56a417dc005623e793945e19808d6d9a9193357) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add comprehensive Skills & Skill Frameworks system to LearnCard Network

    This introduces a complete skill taxonomy system spanning the LearnCard Network plugin, brain service, and shared types. Organizations can now create custom skill frameworks, organize skills hierarchically, attach frameworks to Boosts, and align specific skills to credentials.

    ## Core Features

    ### Skill Framework Management

    -   **Create Managed Frameworks**: Users can create skill frameworks with metadata (name, description, status)
    -   **Framework Ownership**: Frameworks are linked to profiles via `MANAGES` relationship for access control
    -   **Framework Queries**: List, search, and filter frameworks by various criteria
    -   **External Provider Sync**: Optional integration with external skills services

    ### Hierarchical Skill Organization

    -   **Create Skills**: Add individual skills with statement, description, and code to frameworks
    -   **Parent-Child Relationships**: Build skill hierarchies using `IS_CHILD_OF` relationships
    -   **Framework Containment**: Skills linked to frameworks via `CONTAINS` relationships
    -   **Bulk Operations**: Support for creating multiple skills and frameworks efficiently

    ### Boost Integration

    -   **Attach Frameworks**: Link skill frameworks to Boosts using `USES_FRAMEWORK` relationships
    -   **Skill Alignment**: Align specific skills to Boosts via `ALIGNED_TO` relationships
    -   **Ancestor Traversal**: Query skills from frameworks attached to a boost or its ancestors
    -   **Permission Checks**: Validates boost admin rights before allowing framework/skill operations

    ## API Methods Added

    ### Plugin Methods

    -   `createManagedSkillFramework()` - Create a new skill framework
    -   `createManagedSkillFrameworks()` - Bulk create frameworks
    -   `createSkill()` - Add a skill to a framework
    -   `createSkills()` - Bulk create skills
    -   `attachFrameworkToBoost()` - Link framework to boost
    -   `detachFrameworkFromBoost()` - Remove framework from boost
    -   `alignBoostSkills()` - Align specific skills to boost
    -   `getSkillsAvailableForBoost()` - Query alignable skills
    -   `searchSkillsAvailableForBoost()` - Search skills for boost
    -   `getBoostFrameworks()` - List frameworks attached to boost

    ### Brain Service Routes

    -   `skillFrameworks.createManaged` - Create framework with MANAGES relationship
    -   `skillFrameworks.listMine` - Query user's managed frameworks
    -   `skillFrameworks.update` - Update framework metadata
    -   `skills.create` - Create skills with hierarchy support
    -   `skills.update` - Update skill metadata
    -   `skills.searchFrameworkSkills` - Search within framework
    -   `boost.attachFrameworkToBoost` - Establish USES_FRAMEWORK relationship
    -   `boost.alignBoostSkills` - Create ALIGNED_TO relationships
    -   `boost.getSkillsAvailableForBoost` - Graph traversal for available skills

    ## Type System

    ### New Types & Validators

    -   `SkillFrameworkValidator` / `SkillFrameworkType` - Framework structure
    -   `SkillValidator` / `SkillType` - Individual skill structure
    -   `SkillFrameworkStatus` - Framework lifecycle states
    -   `CreateManagedSkillFrameworkInput` - Framework creation params
    -   `SkillFrameworkQuery` - Framework search parameters

    ## Graph Database Schema

    ### New Relationships

    -   `(Profile)-[:MANAGES]->(SkillFramework)` - Framework ownership
    -   `(SkillFramework)-[:CONTAINS]->(Skill)` - Framework-skill membership
    -   `(Skill)-[:IS_CHILD_OF]->(Skill)` - Hierarchical skill organization
    -   `(Boost)-[:USES_FRAMEWORK]->(SkillFramework)` - Framework attachment
    -   `(Boost)-[:ALIGNED_TO]->(Skill)` - Skill alignment for credentials

    ### Access Layer Methods

    -   `createSkillFrameworkNode()` - Persist framework with MANAGES relationship
    -   `createSkill()` - Create skill with CONTAINS and optional IS_CHILD_OF relationships
    -   `setBoostUsesFramework()` - Establish framework attachment
    -   `addAlignedSkillsToBoost()` - Batch create ALIGNED_TO relationships
    -   `getFrameworkSkillsAvailableForBoost()` - Traverse graph for available skills

    This system enables rich skill-based credential metadata, allowing organizations to categorize and align credentials with industry-standard or custom skill taxonomies.

## 5.8.11

### Patch Changes

-   [#833](https://github.com/learningeconomy/LearnCard/pull/833) [`5fbc434308423d97db4fc8cf63898ed8f8980959`](https://github.com/learningeconomy/LearnCard/commit/5fbc434308423d97db4fc8cf63898ed8f8980959) Thanks [@Custard7](https://github.com/Custard7)! - chore: Bump Versions for Embed SDK PR

## 5.8.9

### Patch Changes

-   [#829](https://github.com/learningeconomy/LearnCard/pull/829) [`9d8e71a4e4ca97c004d0d639fcc2869bc008b67e`](https://github.com/learningeconomy/LearnCard/commit/9d8e71a4e4ca97c004d0d639fcc2869bc008b67e) Thanks [@goblincore](https://github.com/goblincore)! - chore: Bump learn-card-types

## 5.8.7

### Patch Changes

-   [#811](https://github.com/learningeconomy/LearnCard/pull/811) [`8c3f9ad3846c57b0442b5a09c74ee63323e47c34`](https://github.com/learningeconomy/LearnCard/commit/8c3f9ad3846c57b0442b5a09c74ee63323e47c34) Thanks [@goblincore](https://github.com/goblincore)! - chore: [LC-1001] Add 'approved' field to user profile

## 5.8.6

### Patch Changes

-   [#800](https://github.com/learningeconomy/LearnCard/pull/800) [`f61e75a7a1de5913e4a7a2b381aa9815e726cec3`](https://github.com/learningeconomy/LearnCard/commit/f61e75a7a1de5913e4a7a2b381aa9815e726cec3) Thanks [@Custard7](https://github.com/Custard7)! - chore: Add Interop Tests for DCC + Multikey to DID Doc

-   [#803](https://github.com/learningeconomy/LearnCard/pull/803) [`beb9c54789a2f48b06e1f82082e1dd51eab6b51d`](https://github.com/learningeconomy/LearnCard/commit/beb9c54789a2f48b06e1f82082e1dd51eab6b51d) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1001] Add country to user profile

## 5.8.5

### Patch Changes

-   [#796](https://github.com/learningeconomy/LearnCard/pull/796) [`00c5403c2932185290ae4e226ca4bf446a1d636c`](https://github.com/learningeconomy/LearnCard/commit/00c5403c2932185290ae4e226ca4bf446a1d636c) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add AUTO_CONNECT claim hook

## 5.8.4

### Patch Changes

-   [#794](https://github.com/learningeconomy/LearnCard/pull/794) [`3707252bea0526aed3c17f0501ec3275e162f6bb`](https://github.com/learningeconomy/LearnCard/commit/3707252bea0526aed3c17f0501ec3275e162f6bb) Thanks [@goblincore](https://github.com/goblincore)! - Add highlightedCredentials field on LCNProfile

## 5.8.3

### Patch Changes

-   [#771](https://github.com/learningeconomy/LearnCard/pull/771) [`d0e2245d915c711d69e98f5a8f5c9fd7909f13ef`](https://github.com/learningeconomy/LearnCard/commit/d0e2245d915c711d69e98f5a8f5c9fd7909f13ef) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add PaginatedBoostRecipientsWithChildren

## 5.8.2

### Patch Changes

-   [#765](https://github.com/learningeconomy/LearnCard/pull/765) [`41a24971a8e9a916736c82e44b5b41f1da1f1a67`](https://github.com/learningeconomy/LearnCard/commit/41a24971a8e9a916736c82e44b5b41f1da1f1a67) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow using bundler moduleResolution

## 5.8.1

### Patch Changes

-   [#753](https://github.com/learningeconomy/LearnCard/pull/753) [`dd5bfff7d94670f43e53d6e7c86a6fd3f80d92b8`](https://github.com/learningeconomy/LearnCard/commit/dd5bfff7d94670f43e53d6e7c86a6fd3f80d92b8) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add defaultEnabled flags to contracts as a UI hint

## 5.8.0

### Minor Changes

-   [#707](https://github.com/learningeconomy/LearnCard/pull/707) [`e6f76c42d840389f791d2767de46b063bb392180`](https://github.com/learningeconomy/LearnCard/commit/e6f76c42d840389f791d2767de46b063bb392180) Thanks [@Custard7](https://github.com/Custard7)! - LC-1805 Feat: Universal Inbox

## 5.7.1

### Patch Changes

-   [#708](https://github.com/learningeconomy/LearnCard/pull/708) [`1b99797c404648412f6a6e8a1f77ebab71caa28c`](https://github.com/learningeconomy/LearnCard/commit/1b99797c404648412f6a6e8a1f77ebab71caa28c) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Introduces a new optional boolean `allowAnyoneToCreateChildren` on Boost nodes.

    When set to `true` on a parent boost:

    -   Any profile can create child boosts without possessing the `canCreateChildren` role permission.
    -   The permission gate (`canProfileCreateChildBoost`) now short-circuits when this flag is detected.

    This change updates:

    -   Boost schema & shared types (`@learncard/types`)
    -   Brain-service model & access-layer logic (`@learncard/network-brain-service`)
    -   Unit and E2E tests to cover the new behaviour.

## 5.7.0

### Minor Changes

-   [#682](https://github.com/learningeconomy/LearnCard/pull/682) [`1ed5313935264890917c6ddf19249ada91d1e524`](https://github.com/learningeconomy/LearnCard/commit/1ed5313935264890917c6ddf19249ada91d1e524) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Include zod-openapi in validators

## 5.6.14

### Patch Changes

-   [#670](https://github.com/learningeconomy/LearnCard/pull/670) [`b04788beded98db2fb3827c94e0810943b7f698a`](https://github.com/learningeconomy/LearnCard/commit/b04788beded98db2fb3827c94e0810943b7f698a) Thanks [@Custard7](https://github.com/Custard7)! - 🧹Housekeeping: OpenAPI Docs

## 5.6.13

### Patch Changes

-   [#662](https://github.com/learningeconomy/LearnCard/pull/662) [`319bd3a589e3529d162825d8f6b97268c44060f4`](https://github.com/learningeconomy/LearnCard/commit/319bd3a589e3529d162825d8f6b97268c44060f4) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - [LC-894] Multiple Contract Issuers

## 5.6.12

### Patch Changes

-   [#666](https://github.com/learningeconomy/LearnCard/pull/666) [`ef22869f9e9b99200e46cbd82dfc4c41558afcd1`](https://github.com/learningeconomy/LearnCard/commit/ef22869f9e9b99200e46cbd82dfc4c41558afcd1) Thanks [@gerardopar](https://github.com/gerardopar)! - LC-907 - New Onboarding flow + Checklist UI

## 5.6.11

### Patch Changes

-   [#606](https://github.com/learningeconomy/LearnCard/pull/606) [`3a7e23f473c6ebeb9aa4ebebfca7938acde7b5ef`](https://github.com/learningeconomy/LearnCard/commit/3a7e23f473c6ebeb9aa4ebebfca7938acde7b5ef) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add support for VC 2.0 Data Model

## 5.6.10

### Patch Changes

-   [`cbc84cc27d1eaf8b6830f06d86d354cb78d8d548`](https://github.com/learningeconomy/LearnCard/commit/cbc84cc27d1eaf8b6830f06d86d354cb78d8d548) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Remove NX caching in CI to ensure latest builds

## 5.6.9

### Patch Changes

-   [#641](https://github.com/learningeconomy/LearnCard/pull/641) [`833ef629a073fd4d202eaebceb0fb48615daa0c9`](https://github.com/learningeconomy/LearnCard/commit/833ef629a073fd4d202eaebceb0fb48615daa0c9) Thanks [@Custard7](https://github.com/Custard7)! - Feat: Add AuthGrant support

## 5.6.8

### Patch Changes

-   [#638](https://github.com/learningeconomy/LearnCard/pull/638) [`66b77d32cb7219ff50959762368bbbf549f8468b`](https://github.com/learningeconomy/LearnCard/commit/66b77d32cb7219ff50959762368bbbf549f8468b) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Include autoboosts as part of contract details

## 5.6.7

### Patch Changes

-   [#623](https://github.com/learningeconomy/LearnCard/pull/623) [`160b2f67bd119de64d26d4b16ef7ae718e34a897`](https://github.com/learningeconomy/LearnCard/commit/160b2f67bd119de64d26d4b16ef7ae718e34a897) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add credential writing capability to consent flow contracts, enabling third parties to issue credentials to profiles that have consented to a contract with appropriate write permissions

-   [#623](https://github.com/learningeconomy/LearnCard/pull/623) [`160b2f67bd119de64d26d4b16ef7ae718e34a897`](https://github.com/learningeconomy/LearnCard/commit/160b2f67bd119de64d26d4b16ef7ae718e34a897) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow viewing written credentials for a contract

-   [#623](https://github.com/learningeconomy/LearnCard/pull/623) [`160b2f67bd119de64d26d4b16ef7ae718e34a897`](https://github.com/learningeconomy/LearnCard/commit/160b2f67bd119de64d26d4b16ef7ae718e34a897) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add Auto-Boosts, which are boosts that are automatically issued once someone consents to a contract

## 5.6.6

### Patch Changes

-   [#619](https://github.com/learningeconomy/LearnCard/pull/619) [`65d3a6ca9161d227d57a2caaf0c63241e21dc360`](https://github.com/learningeconomy/LearnCard/commit/65d3a6ca9161d227d57a2caaf0c63241e21dc360) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add ADD_ADMIN Claim Hook type that automatically grants admin privileges when claiming a boost. This enables:

    -   Automatic admin role assignment for target boosts when claiming a source boost
    -   Requires admin permissions on both source and target boosts to create hook
    -   Cascading deletion when either boost is removed
    -   Validation of admin permissions hierarchy during hook creation

## 5.6.5

### Patch Changes

-   [#604](https://github.com/learningeconomy/LearnCard/pull/604) [`6f0c776840addd052a9df844fefdcb3186c7678d`](https://github.com/learningeconomy/LearnCard/commit/6f0c776840addd052a9df844fefdcb3186c7678d) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add lightweight claim hooks

## 5.6.4

### Patch Changes

-   [#596](https://github.com/learningeconomy/LearnCard/pull/596) [`a4eead401a62a872be046e28b0d27b2d980ced3a`](https://github.com/learningeconomy/LearnCard/commit/a4eead401a62a872be046e28b0d27b2d980ced3a) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add JWKWithPrivateKey type

## 5.6.3

### Patch Changes

-   [#594](https://github.com/learningeconomy/LearnCard/pull/594) [`86bdf08214003e1db051f5a0e93c3a57e282db62`](https://github.com/learningeconomy/LearnCard/commit/86bdf08214003e1db051f5a0e93c3a57e282db62) Thanks [@smurflo2](https://github.com/smurflo2)! - Add redirectUrl field for ConsentFlow contracts

## 5.6.2

### Patch Changes

-   [#592](https://github.com/learningeconomy/LearnCard/pull/592) [`7d4e9dc7683bb8fa75fb6e239f59e620d3237846`](https://github.com/learningeconomy/LearnCard/commit/7d4e9dc7683bb8fa75fb6e239f59e620d3237846) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add isPrivate to profiles to prevent them from surfacing in search

## 5.6.1

### Patch Changes

-   [#587](https://github.com/learningeconomy/LearnCard/pull/587) [`ebb2d3e69d14d97dc2691a45d0820bbf4a46be71`](https://github.com/learningeconomy/LearnCard/commit/ebb2d3e69d14d97dc2691a45d0820bbf4a46be71) Thanks [@smurflo2](https://github.com/smurflo2)! - [LC-735] Add needsGuardianConsent flag for ConsentFlow contracts

## 5.6.0

### Minor Changes

-   [#582](https://github.com/learningeconomy/LearnCard/pull/582) [`611e911f6f1388e5d34bc893c53aef36d28ae65e`](https://github.com/learningeconomy/LearnCard/commit/611e911f6f1388e5d34bc893c53aef36d28ae65e) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add support for Profile Managers for more sophisticated identity management

## 5.5.9

### Patch Changes

-   [#578](https://github.com/learningeconomy/LearnCard/pull/578) [`20d4585c3a2bc8c5eb4b0a628eb215be829000fa`](https://github.com/learningeconomy/LearnCard/commit/20d4585c3a2bc8c5eb4b0a628eb215be829000fa) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add display field to profiles

## 5.5.8

### Patch Changes

-   [#569](https://github.com/learningeconomy/LearnCard/pull/569) [`72e9661ffe0c9f9e3c312ecba2b6441d61941a4a`](https://github.com/learningeconomy/LearnCard/commit/72e9661ffe0c9f9e3c312ecba2b6441d61941a4a) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - - Don't give default claim role if profile already has a role
    -   Allow profiles who can resolve parents to resolve children
    -   Return default claim permissions from `getBoost`
    -   Fix `generateClaimLink` permissions check
    -   Actually allow `$regex` to work via `superjson` with tRPC, regex strings with HTTP API
    -   Allow querying boost recipients

## 5.5.7

### Patch Changes

-   [#564](https://github.com/learningeconomy/LearnCard/pull/564) [`6981bceed48ff00edcc94124f5ca0461f3b00a2d`](https://github.com/learningeconomy/LearnCard/commit/6981bceed48ff00edcc94124f5ca0461f3b00a2d) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow $regex in boost queries

-   [#564](https://github.com/learningeconomy/LearnCard/pull/564) [`6981bceed48ff00edcc94124f5ca0461f3b00a2d`](https://github.com/learningeconomy/LearnCard/commit/6981bceed48ff00edcc94124f5ca0461f3b00a2d) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add meta field to Boosts that can be updated even after the Boost has been published

## 5.5.6

### Patch Changes

-   [#559](https://github.com/learningeconomy/LearnCard/pull/559) [`0b0a2c630d66f422f02f385fba8328767621e8bf`](https://github.com/learningeconomy/LearnCard/commit/0b0a2c630d66f422f02f385fba8328767621e8bf) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add default permissions you can receive when claiming a boost

## 5.5.5

### Patch Changes

-   [#555](https://github.com/learningeconomy/LearnCard/pull/555) [`c01a127b8633658d64f0610690c69965339aced2`](https://github.com/learningeconomy/LearnCard/commit/c01a127b8633658d64f0610690c69965339aced2) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add $in to boost queries

## 5.5.4

### Patch Changes

-   [#546](https://github.com/learningeconomy/LearnCard/pull/546) [`859ed5791aecc5d8dec6496347d5ade8fbe0fc5f`](https://github.com/learningeconomy/LearnCard/commit/859ed5791aecc5d8dec6496347d5ade8fbe0fc5f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add BoostPermissions type

## 5.5.3

### Patch Changes

-   [#524](https://github.com/learningeconomy/LearnCard/pull/524) [`035df02f21226ac1645b611e2f934c2d7e4cbd55`](https://github.com/learningeconomy/LearnCard/commit/035df02f21226ac1645b611e2f934c2d7e4cbd55) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix build issues

## 5.5.2

### Patch Changes

-   [#509](https://github.com/learningeconomy/LearnCard/pull/509) [`39f88b0`](https://github.com/learningeconomy/LearnCard/commit/39f88b0de824fe8b6b29997a2064c4965ac042f6) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow webhooks that don't use https

## 5.5.1

### Patch Changes

-   [#451](https://github.com/learningeconomy/LearnCard/pull/451) [`e70c1671`](https://github.com/learningeconomy/LearnCard/commit/e70c1671213712527d0df447ff25ba7f101f94ae) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add more fields to LCN Profiles

-   [#451](https://github.com/learningeconomy/LearnCard/pull/451) [`e70c1671`](https://github.com/learningeconomy/LearnCard/commit/e70c1671213712527d0df447ff25ba7f101f94ae) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add DidDocument type

-   [#453](https://github.com/learningeconomy/LearnCard/pull/453) [`587736f`](https://github.com/learningeconomy/LearnCard/commit/587736fd8e562d17b9dfbfcd058572c133367c02) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Granular sharing options for Contract Terms

## 5.5.0

### Minor Changes

-   [#433](https://github.com/learningeconomy/LearnCard/pull/433) [`be01a1a`](https://github.com/learningeconomy/LearnCard/commit/be01a1a3d1b5dde523b1dcfb5be2a2452f26f7a7) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow changing sort order in Index Plane

## 5.4.1

### Patch Changes

-   [#412](https://github.com/learningeconomy/LearnCard/pull/412) [`1cb031d7`](https://github.com/learningeconomy/LearnCard/commit/1cb031d7483e80f947c93e3479fe85af8ec09dbb) Thanks [@cboydstun](https://github.com/cboydstun)! - quest [LC-155] Updated Boost Cards

    updated wallet card squares

-   [#411](https://github.com/learningeconomy/LearnCard/pull/411) [`725e508c`](https://github.com/learningeconomy/LearnCard/commit/725e508c848b8c7752f44e5bf9915eebb421d766) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add ConsentFlow types

-   [#411](https://github.com/learningeconomy/LearnCard/pull/411) [`725e508c`](https://github.com/learningeconomy/LearnCard/commit/725e508c848b8c7752f44e5bf9915eebb421d766) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add bio to LCN Profiles

## 5.4.0

### Minor Changes

-   [#386](https://github.com/learningeconomy/LearnCard/pull/386) [`3438685`](https://github.com/learningeconomy/LearnCard/commit/3438685d8a0ba2ac7d7fb6d05fe817f1763e2f55) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add autoConnectRecipients to Boost metadata

## 5.3.4

### Patch Changes

-   [#388](https://github.com/learningeconomy/LearnCard/pull/388) [`336876b`](https://github.com/learningeconomy/LearnCard/commit/336876b4b98e37157b8a133ed3b72801eb3d1cd8) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Emit declarationMap

## 5.3.3

### Patch Changes

-   [#371](https://github.com/learningeconomy/LearnCard/pull/371) [`56aef2d`](https://github.com/learningeconomy/LearnCard/commit/56aef2d7830a5c66fa3b569b3c25eb3ecb6cc465) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Don't strip fields from credentialStatus

## 5.3.2

### Patch Changes

-   [#312](https://github.com/learningeconomy/LearnCard/pull/312) [`a0b62f3`](https://github.com/learningeconomy/LearnCard/commit/a0b62f351d32c4e0a788b519dd852aa5df9e6c8a) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add EncryptedRecord types

## 5.3.1

### Patch Changes

-   [#301](https://github.com/learningeconomy/LearnCard/pull/301) [`23b48d7`](https://github.com/learningeconomy/LearnCard/commit/23b48d7b8221e6191d089735f13d925f69d3c800) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Loosen BoostRecipientInfo type to allow getting recipient info for boosts that haven't been received yet

## 5.3.0

### Minor Changes

-   [#300](https://github.com/learningeconomy/LearnCard/pull/300) [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - LearnCloud types

### Patch Changes

-   [#300](https://github.com/learningeconomy/LearnCard/pull/300) [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add paginated types for EncryptedCredentialRecords

## 5.2.9

### Patch Changes

-   [`74e459d`](https://github.com/learningeconomy/LearnCard/commit/74e459d0089497cbf031d18305f33fa539f2a96f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Empty version bump

## 5.2.8

### Patch Changes

-   [#289](https://github.com/learningeconomy/LearnCard/pull/289) [`4787227`](https://github.com/learningeconomy/LearnCard/commit/4787227c2e8a2b4ffa4c8b177920f80feed8a64b) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update notification type to not possibly be a string

## 5.2.7

### Patch Changes

-   No change, just forcible version bump

## 5.2.6

### Patch Changes

-   [#263](https://github.com/learningeconomy/LearnCard/pull/263) [`82289ba`](https://github.com/learningeconomy/LearnCard/commit/82289bacb997880ae25eaf833afe5c9e4ad68c37) Thanks [@Custard7](https://github.com/Custard7)! - ### Feat: Add Draft / Live state to Boosts

    This introduces a new `status` field on boosts, currently supporting:

    ```
    LIVE
    DRAFT
    ```

    `LIVE` status indicates the boost is published and can be sent to others. Live Boosts can not be updated or deleted.
    `DRAFT` status indicates the boost is in draft state. It can not be sent to others. Draft boosts can be updated and deleted.

    #### Major Changes:

    -   updateBoost (in the LCN plugin) now supports an additional `credential` field that allows you to pass through a new base credential template for the boost
    -   updateBoost allows you to pass a status field in, that can flip the status of a boost from DRAFT to LIVE.
    -   adds support for deleting draft boosts (and preventing deleting live boosts)
    -   adds support for updating draft boosts (and preventing updating live boosts)
    -   prevents sending draft boosts, or creating claim links for draft boosts

## 5.2.5

### Patch Changes

-   [#262](https://github.com/learningeconomy/LearnCard/pull/262) [`37133bf`](https://github.com/learningeconomy/LearnCard/commit/37133bf375a883c8086ba837c2155a609dea1912) Thanks [@Custard7](https://github.com/Custard7)! - Add Signing Authorities and Claim Links

    Adds the following plugin Methods to the LearnCard Network:

    -   registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    -   getRegisteredSigningAuthorities: (endpoint: string, name: string, did: string) => Promise<LCNSigningAuthorityForUserType[]>;
    -   getRegisteredSigningAuthority: (endpoint: string, name: string) => Promise<LCNSigningAuthorityForUserType>;

    -   generateClaimLink: (boostUri: string, claimLinkSA: LCNBoostClaimLinkSigningAuthorityType, challenge?: string) => Promise<{ boostUri: string, challenge: string}>;
    -   claimBoostWithLink: (boostUri: string, challenge: string) => Promise<string>;

## 5.2.4

### Patch Changes

-   [#252](https://github.com/learningeconomy/LearnCard/pull/252) [`f6abbd4`](https://github.com/learningeconomy/LearnCard/commit/f6abbd490e02f65d56465ec5853aa31cfd2ae40c) Thanks [@Custard7](https://github.com/Custard7)! - Update to prepare for LCA Notifications Webhook

    Adds LCNNotification types for notification webhook payload
    Updates learn card core getDidAuthVp() to use learnCard.id.did() instead of 'key' did method.
    Removes previous notification microservice functions.
    Adds SendNotification for sending notifications to external webhook service

## 5.2.3

### Patch Changes

-   [#249](https://github.com/learningeconomy/LearnCard/pull/249) [`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1) Thanks [@goblincore](https://github.com/goblincore)! - Republish

## 5.2.2

### Patch Changes

-   [#231](https://github.com/learningeconomy/LearnCard/pull/231) [`e69af5a`](https://github.com/learningeconomy/LearnCard/commit/e69af5ab09b88d111ddf207f413552aa0bac991a) Thanks [@Custard7](https://github.com/Custard7)! - Feat: Add includeConnectionStatus option to searchProfiles, in brain-service and LCN Plugin

## 5.2.1

### Patch Changes

-   [#216](https://github.com/learningeconomy/LearnCard/pull/216) [`13d0393`](https://github.com/learningeconomy/LearnCard/commit/13d0393725d9d5e17b02de7a8088f46bda688d92) Thanks [@Custard7](https://github.com/Custard7)! - - Updates LCN Brain to wrap VCs in a `CertifiedBoost` VC when using `sendBoost`, and verifying that the VCs use the boostId, and verify that the sender is authorized to issue the boost + that the credential matches the boost credential.

    -   Updates LCN Plugin to append boostId to a boost VC when calling `sendBoost()`
    -   Adds `getBoostRecipients` function to LCN Brain + LCN Plugin so you can retrieve a list of boost recipients
    -   Adds new `boost` type to `learnCard.invoke.newCredential({ type: 'boost' })` to VC Templates Plugin
    -   Adds new VC Verification plugin, extending `learnCard.invoke.verifyCredential()` so it will verify a CertifiedBoost VC with a registry of trusted CertifiedBoost verifiers
    -   Add tests for LCN Plugin + VerifyBoost Plugin
    -   Add tests for `sendBoost` for LCN Brain
    -   Add tests for `getBoostRecipients` for LCN Brain

-   [#229](https://github.com/learningeconomy/LearnCard/pull/229) [`ed3c460`](https://github.com/learningeconomy/LearnCard/commit/ed3c460fadae88702c1244795ab3b7483d97bab7) Thanks [@Custard7](https://github.com/Custard7)! - - Updates LCN Brain to wrap VCs in a `CertifiedBoost` VC when using `sendBoost`, and verifying that the VCs use the boostId, and verify that the sender is authorized to issue the boost + that the credential matches the boost credential.
    -   Updates LCN Plugin to append boostId to a boost VC when calling `sendBoost()`
    -   Adds `getBoostRecipients` function to LCN Brain + LCN Plugin so you can retrieve a list of boost recipients
    -   Adds new `boost` type to `learnCard.invoke.newCredential({ type: 'boost' })` to VC Templates Plugin
    -   Adds new VC Verification plugin, extending `learnCard.invoke.verifyCredential()` so it will verify a CertifiedBoost VC with a registry of trusted CertifiedBoost verifiers
    -   Add tests for LCN Plugin + VerifyBoost Plugin
    -   Add tests for `sendBoost` for LCN Brain
    -   Add tests for `getBoostRecipients` for LCN Brain

## 5.2.0

### Minor Changes

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add LCN Types

## 5.1.1

### Patch Changes

-   [#196](https://github.com/learningeconomy/LearnCard/pull/196) [`9aeb9f1`](https://github.com/learningeconomy/LearnCard/commit/9aeb9f1c175fd5ab7f2b94addaa9132bcc9cb4cf) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow embedded contexts

## 5.1.0

### Minor Changes

-   [#160](https://github.com/learningeconomy/LearnCard/pull/160) [`982bd41`](https://github.com/learningeconomy/LearnCard/commit/982bd4151d485ec6977c0bf774fe1cf243b8db74) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Make credential optional in VP type

## 5.0.1

### Patch Changes

-   [#162](https://github.com/learningeconomy/LearnCard/pull/162) [`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Eject from aqu

## 5.0.0

### Major Changes

-   [#130](https://github.com/learningeconomy/LearnCard/pull/130) [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Rename IDXCredential to CredentialRecord

## 4.0.1

### Patch Changes

-   [#115](https://github.com/learningeconomy/LearnCard/pull/115) [`efab28a`](https://github.com/learningeconomy/LearnCard/commit/efab28ae5c9487239537d220316f5a216d64fe58) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix VC schema throwing if issuer.type is not an array

## 4.0.0

### Major Changes

-   [#113](https://github.com/learningeconomy/LearnCard/pull/113) [`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - BREAKING CHANGE: IDX Schema now uses ID and URI rather than streamID and Title

## 3.1.0

### Minor Changes

-   [#111](https://github.com/learningeconomy/LearnCard/pull/111) [`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix incorrect IDXCredential type, making it also correctly generic

## 3.0.2

### Patch Changes

-   [#107](https://github.com/learningeconomy/LearnCard/pull/107) [`d3e542d`](https://github.com/learningeconomy/LearnCard/commit/d3e542d412eb20644b2d14efa3d728cecdf53adc) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Expose KnownAchievementType

## 3.0.1

### Patch Changes

-   [#100](https://github.com/learningeconomy/LearnCard/pull/100) [`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add JWK type

## 3.0.0

### Major Changes

-   [#79](https://github.com/learningeconomy/LearnCard/pull/79) [`c1befdc`](https://github.com/learningeconomy/LearnCard/commit/c1befdc8a30d3cc111d938c530493b1a5b87aa00) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix types that don't follow spec

## 2.2.1

### Patch Changes

-   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update ReadMe

## 2.2.0

### Minor Changes

-   [#40](https://github.com/learningeconomy/LearnCard/pull/40) [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Move IDXCredential and StorageType types to @learncard/types

## 2.1.2

### Patch Changes

-   Move didkit into its own plugin

## 2.1.1

### Patch Changes

-   Fix botched release

## 2.1.0

### Minor Changes

-   Upgrade @learncard/types to use zod and implement types for VCs/OBv3

## 2.0.1

### Patch Changes

-   Update ReadMe

## 2.0.0

### Major Changes

-   Rename to @learncard/types

## 1.2.1

### Patch Changes

-   Add minimum time for verification loader animation

## 1.2.0

### Minor Changes

-   Update Update VCDisplayCard to accept a credential

## 1.1.0

### Minor Changes

-   0a650d4: Move VC types to learn-card-types

## 1.0.0

### Major Changes

-   Release Learn Card Types, add stuff to react-learn-card
