# @learncard/helpers

## 1.2.4

### Patch Changes

-   Updated dependencies [[`016b7edc231273aab962b89b4351a3e229fca025`](https://github.com/learningeconomy/LearnCard/commit/016b7edc231273aab962b89b4351a3e229fca025)]:
    -   @learncard/types@5.11.3

## 1.2.3

### Patch Changes

-   Updated dependencies [[`73865cc62ea292badb99fe41ca8b0f484a12728f`](https://github.com/learningeconomy/LearnCard/commit/73865cc62ea292badb99fe41ca8b0f484a12728f)]:
    -   @learncard/types@5.11.2

## 1.2.2

### Patch Changes

-   Updated dependencies [[`f8e50b1e3ceafccde28bef859b2c8b220acb2b7d`](https://github.com/learningeconomy/LearnCard/commit/f8e50b1e3ceafccde28bef859b2c8b220acb2b7d)]:
    -   @learncard/types@5.11.1

## 1.2.1

### Patch Changes

-   Updated dependencies [[`3727c732ad54b4a8ccb89c6354291799e953c8ab`](https://github.com/learningeconomy/LearnCard/commit/3727c732ad54b4a8ccb89c6354291799e953c8ab), [`bb6749d4cd123ca1fcee8d6f657861ae77a614a2`](https://github.com/learningeconomy/LearnCard/commit/bb6749d4cd123ca1fcee8d6f657861ae77a614a2)]:
    -   @learncard/types@5.11.0

## 1.2.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9), [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/types@5.10.0

## 1.1.32

### Patch Changes

-   Updated dependencies [[`cb518c2f15b8257eb07fa2c606f52dd3304bc9ea`](https://github.com/learningeconomy/LearnCard/commit/cb518c2f15b8257eb07fa2c606f52dd3304bc9ea)]:
    -   @learncard/types@5.9.2

## 1.1.31

### Patch Changes

-   Updated dependencies [[`a8ba030d48e75094fd64cd3da0725c3c0f468cf2`](https://github.com/learningeconomy/LearnCard/commit/a8ba030d48e75094fd64cd3da0725c3c0f468cf2)]:
    -   @learncard/types@5.9.1

## 1.1.30

### Patch Changes

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

-   Updated dependencies [[`f56a417dc005623e793945e19808d6d9a9193357`](https://github.com/learningeconomy/LearnCard/commit/f56a417dc005623e793945e19808d6d9a9193357)]:
    -   @learncard/types@5.9.0

## 1.1.29

### Patch Changes

-   Updated dependencies [[`5fbc434308423d97db4fc8cf63898ed8f8980959`](https://github.com/learningeconomy/LearnCard/commit/5fbc434308423d97db4fc8cf63898ed8f8980959)]:
    -   @learncard/types@5.8.11

## 1.1.28

### Patch Changes

-   Updated dependencies [[`9d8e71a4e4ca97c004d0d639fcc2869bc008b67e`](https://github.com/learningeconomy/LearnCard/commit/9d8e71a4e4ca97c004d0d639fcc2869bc008b67e)]:
    -   @learncard/types@5.8.9

## 1.1.27

### Patch Changes

-   Updated dependencies [[`8c3f9ad3846c57b0442b5a09c74ee63323e47c34`](https://github.com/learningeconomy/LearnCard/commit/8c3f9ad3846c57b0442b5a09c74ee63323e47c34)]:
    -   @learncard/types@5.8.7

## 1.1.26

### Patch Changes

-   Updated dependencies [[`f61e75a7a1de5913e4a7a2b381aa9815e726cec3`](https://github.com/learningeconomy/LearnCard/commit/f61e75a7a1de5913e4a7a2b381aa9815e726cec3), [`beb9c54789a2f48b06e1f82082e1dd51eab6b51d`](https://github.com/learningeconomy/LearnCard/commit/beb9c54789a2f48b06e1f82082e1dd51eab6b51d)]:
    -   @learncard/types@5.8.6

## 1.1.25

### Patch Changes

-   Updated dependencies [[`00c5403c2932185290ae4e226ca4bf446a1d636c`](https://github.com/learningeconomy/LearnCard/commit/00c5403c2932185290ae4e226ca4bf446a1d636c)]:
    -   @learncard/types@5.8.5

## 1.1.24

### Patch Changes

-   Updated dependencies [[`3707252bea0526aed3c17f0501ec3275e162f6bb`](https://github.com/learningeconomy/LearnCard/commit/3707252bea0526aed3c17f0501ec3275e162f6bb)]:
    -   @learncard/types@5.8.4

## 1.1.23

### Patch Changes

-   Updated dependencies [[`d0e2245d915c711d69e98f5a8f5c9fd7909f13ef`](https://github.com/learningeconomy/LearnCard/commit/d0e2245d915c711d69e98f5a8f5c9fd7909f13ef)]:
    -   @learncard/types@5.8.3

## 1.1.22

### Patch Changes

-   [#765](https://github.com/learningeconomy/LearnCard/pull/765) [`41a24971a8e9a916736c82e44b5b41f1da1f1a67`](https://github.com/learningeconomy/LearnCard/commit/41a24971a8e9a916736c82e44b5b41f1da1f1a67) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow using bundler moduleResolution

-   Updated dependencies [[`41a24971a8e9a916736c82e44b5b41f1da1f1a67`](https://github.com/learningeconomy/LearnCard/commit/41a24971a8e9a916736c82e44b5b41f1da1f1a67)]:
    -   @learncard/types@5.8.2

## 1.1.21

### Patch Changes

-   Updated dependencies [[`dd5bfff7d94670f43e53d6e7c86a6fd3f80d92b8`](https://github.com/learningeconomy/LearnCard/commit/dd5bfff7d94670f43e53d6e7c86a6fd3f80d92b8)]:
    -   @learncard/types@5.8.1

## 1.1.20

### Patch Changes

-   [#724](https://github.com/learningeconomy/LearnCard/pull/724) [`610657555402897bc2b0321be81a17975d28c0f4`](https://github.com/learningeconomy/LearnCard/commit/610657555402897bc2b0321be81a17975d28c0f4) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add isVC2 helper

## 1.1.19

### Patch Changes

-   Updated dependencies [[`e6f76c42d840389f791d2767de46b063bb392180`](https://github.com/learningeconomy/LearnCard/commit/e6f76c42d840389f791d2767de46b063bb392180)]:
    -   @learncard/types@5.8.0

## 1.1.18

### Patch Changes

-   Updated dependencies [[`1b99797c404648412f6a6e8a1f77ebab71caa28c`](https://github.com/learningeconomy/LearnCard/commit/1b99797c404648412f6a6e8a1f77ebab71caa28c)]:
    -   @learncard/types@5.7.1

## 1.1.17

### Patch Changes

-   Updated dependencies [[`1ed5313935264890917c6ddf19249ada91d1e524`](https://github.com/learningeconomy/LearnCard/commit/1ed5313935264890917c6ddf19249ada91d1e524)]:
    -   @learncard/types@5.7.0

## 1.1.16

### Patch Changes

-   Updated dependencies [[`b04788beded98db2fb3827c94e0810943b7f698a`](https://github.com/learningeconomy/LearnCard/commit/b04788beded98db2fb3827c94e0810943b7f698a)]:
    -   @learncard/types@5.6.14

## 1.1.15

### Patch Changes

-   Updated dependencies [[`319bd3a589e3529d162825d8f6b97268c44060f4`](https://github.com/learningeconomy/LearnCard/commit/319bd3a589e3529d162825d8f6b97268c44060f4)]:
    -   @learncard/types@5.6.13

## 1.1.14

### Patch Changes

-   Updated dependencies [[`ef22869f9e9b99200e46cbd82dfc4c41558afcd1`](https://github.com/learningeconomy/LearnCard/commit/ef22869f9e9b99200e46cbd82dfc4c41558afcd1)]:
    -   @learncard/types@5.6.12

## 1.1.13

### Patch Changes

-   Updated dependencies [[`3a7e23f473c6ebeb9aa4ebebfca7938acde7b5ef`](https://github.com/learningeconomy/LearnCard/commit/3a7e23f473c6ebeb9aa4ebebfca7938acde7b5ef)]:
    -   @learncard/types@5.6.11

## 1.1.12

### Patch Changes

-   [`cbc84cc27d1eaf8b6830f06d86d354cb78d8d548`](https://github.com/learningeconomy/LearnCard/commit/cbc84cc27d1eaf8b6830f06d86d354cb78d8d548) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Remove NX caching in CI to ensure latest builds

-   Updated dependencies [[`cbc84cc27d1eaf8b6830f06d86d354cb78d8d548`](https://github.com/learningeconomy/LearnCard/commit/cbc84cc27d1eaf8b6830f06d86d354cb78d8d548)]:
    -   @learncard/types@5.6.10

## 1.1.11

### Patch Changes

-   Updated dependencies [[`833ef629a073fd4d202eaebceb0fb48615daa0c9`](https://github.com/learningeconomy/LearnCard/commit/833ef629a073fd4d202eaebceb0fb48615daa0c9)]:
    -   @learncard/types@5.6.9

## 1.1.10

### Patch Changes

-   Updated dependencies [[`66b77d32cb7219ff50959762368bbbf549f8468b`](https://github.com/learningeconomy/LearnCard/commit/66b77d32cb7219ff50959762368bbbf549f8468b)]:
    -   @learncard/types@5.6.8

## 1.1.9

### Patch Changes

-   Updated dependencies [[`160b2f67bd119de64d26d4b16ef7ae718e34a897`](https://github.com/learningeconomy/LearnCard/commit/160b2f67bd119de64d26d4b16ef7ae718e34a897), [`160b2f67bd119de64d26d4b16ef7ae718e34a897`](https://github.com/learningeconomy/LearnCard/commit/160b2f67bd119de64d26d4b16ef7ae718e34a897), [`160b2f67bd119de64d26d4b16ef7ae718e34a897`](https://github.com/learningeconomy/LearnCard/commit/160b2f67bd119de64d26d4b16ef7ae718e34a897)]:
    -   @learncard/types@5.6.7

## 1.1.8

### Patch Changes

-   Updated dependencies [[`65d3a6ca9161d227d57a2caaf0c63241e21dc360`](https://github.com/learningeconomy/LearnCard/commit/65d3a6ca9161d227d57a2caaf0c63241e21dc360)]:
    -   @learncard/types@5.6.6

## 1.1.7

### Patch Changes

-   Updated dependencies [[`6f0c776840addd052a9df844fefdcb3186c7678d`](https://github.com/learningeconomy/LearnCard/commit/6f0c776840addd052a9df844fefdcb3186c7678d)]:
    -   @learncard/types@5.6.5

## 1.1.6

### Patch Changes

-   Updated dependencies [[`a4eead401a62a872be046e28b0d27b2d980ced3a`](https://github.com/learningeconomy/LearnCard/commit/a4eead401a62a872be046e28b0d27b2d980ced3a)]:
    -   @learncard/types@5.6.4

## 1.1.5

### Patch Changes

-   Updated dependencies [[`86bdf08214003e1db051f5a0e93c3a57e282db62`](https://github.com/learningeconomy/LearnCard/commit/86bdf08214003e1db051f5a0e93c3a57e282db62)]:
    -   @learncard/types@5.6.3

## 1.1.4

### Patch Changes

-   Updated dependencies [[`7d4e9dc7683bb8fa75fb6e239f59e620d3237846`](https://github.com/learningeconomy/LearnCard/commit/7d4e9dc7683bb8fa75fb6e239f59e620d3237846)]:
    -   @learncard/types@5.6.2

## 1.1.3

### Patch Changes

-   Updated dependencies [[`ebb2d3e69d14d97dc2691a45d0820bbf4a46be71`](https://github.com/learningeconomy/LearnCard/commit/ebb2d3e69d14d97dc2691a45d0820bbf4a46be71)]:
    -   @learncard/types@5.6.1

## 1.1.2

### Patch Changes

-   Updated dependencies [[`611e911f6f1388e5d34bc893c53aef36d28ae65e`](https://github.com/learningeconomy/LearnCard/commit/611e911f6f1388e5d34bc893c53aef36d28ae65e)]:
    -   @learncard/types@5.6.0

## 1.1.1

### Patch Changes

-   Updated dependencies [[`20d4585c3a2bc8c5eb4b0a628eb215be829000fa`](https://github.com/learningeconomy/LearnCard/commit/20d4585c3a2bc8c5eb4b0a628eb215be829000fa)]:
    -   @learncard/types@5.5.9

## 1.1.0

### Minor Changes

-   [#573](https://github.com/learningeconomy/LearnCard/pull/573) [`5abe7679d8c0a71952112b686ca9fdf66d0d50c0`](https://github.com/learningeconomy/LearnCard/commit/5abe7679d8c0a71952112b686ca9fdf66d0d50c0) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix backwards compat

## 1.0.20

### Patch Changes

-   Updated dependencies [[`72e9661ffe0c9f9e3c312ecba2b6441d61941a4a`](https://github.com/learningeconomy/LearnCard/commit/72e9661ffe0c9f9e3c312ecba2b6441d61941a4a)]:
    -   @learncard/types@5.5.8

## 1.0.19

### Patch Changes

-   Updated dependencies [[`6981bceed48ff00edcc94124f5ca0461f3b00a2d`](https://github.com/learningeconomy/LearnCard/commit/6981bceed48ff00edcc94124f5ca0461f3b00a2d), [`6981bceed48ff00edcc94124f5ca0461f3b00a2d`](https://github.com/learningeconomy/LearnCard/commit/6981bceed48ff00edcc94124f5ca0461f3b00a2d)]:
    -   @learncard/types@5.5.7

## 1.0.18

### Patch Changes

-   Updated dependencies [[`0b0a2c630d66f422f02f385fba8328767621e8bf`](https://github.com/learningeconomy/LearnCard/commit/0b0a2c630d66f422f02f385fba8328767621e8bf)]:
    -   @learncard/types@5.5.6

## 1.0.17

### Patch Changes

-   Updated dependencies [[`c01a127b8633658d64f0610690c69965339aced2`](https://github.com/learningeconomy/LearnCard/commit/c01a127b8633658d64f0610690c69965339aced2)]:
    -   @learncard/types@5.5.5

## 1.0.16

### Patch Changes

-   Updated dependencies [[`859ed5791aecc5d8dec6496347d5ade8fbe0fc5f`](https://github.com/learningeconomy/LearnCard/commit/859ed5791aecc5d8dec6496347d5ade8fbe0fc5f)]:
    -   @learncard/types@5.5.4

## 1.0.15

### Patch Changes

-   Updated dependencies [[`035df02f21226ac1645b611e2f934c2d7e4cbd55`](https://github.com/learningeconomy/LearnCard/commit/035df02f21226ac1645b611e2f934c2d7e4cbd55)]:
    -   @learncard/types@5.5.3

## 1.0.14

### Patch Changes

-   Updated dependencies [[`39f88b0`](https://github.com/learningeconomy/LearnCard/commit/39f88b0de824fe8b6b29997a2064c4965ac042f6)]:
    -   @learncard/types@5.5.2

## 1.0.13

### Patch Changes

-   Updated dependencies [[`e70c1671`](https://github.com/learningeconomy/LearnCard/commit/e70c1671213712527d0df447ff25ba7f101f94ae), [`e70c1671`](https://github.com/learningeconomy/LearnCard/commit/e70c1671213712527d0df447ff25ba7f101f94ae), [`587736f`](https://github.com/learningeconomy/LearnCard/commit/587736fd8e562d17b9dfbfcd058572c133367c02)]:
    -   @learncard/types@5.5.1

## 1.0.12

### Patch Changes

-   Updated dependencies [[`be01a1a`](https://github.com/learningeconomy/LearnCard/commit/be01a1a3d1b5dde523b1dcfb5be2a2452f26f7a7)]:
    -   @learncard/types@5.5.0

## 1.0.11

### Patch Changes

-   Updated dependencies [[`1cb031d7`](https://github.com/learningeconomy/LearnCard/commit/1cb031d7483e80f947c93e3479fe85af8ec09dbb), [`725e508c`](https://github.com/learningeconomy/LearnCard/commit/725e508c848b8c7752f44e5bf9915eebb421d766), [`725e508c`](https://github.com/learningeconomy/LearnCard/commit/725e508c848b8c7752f44e5bf9915eebb421d766)]:
    -   @learncard/types@5.4.1

## 1.0.10

### Patch Changes

-   Updated dependencies [[`3438685`](https://github.com/learningeconomy/LearnCard/commit/3438685d8a0ba2ac7d7fb6d05fe817f1763e2f55)]:
    -   @learncard/types@5.4.0

## 1.0.9

### Patch Changes

-   [#388](https://github.com/learningeconomy/LearnCard/pull/388) [`336876b`](https://github.com/learningeconomy/LearnCard/commit/336876b4b98e37157b8a133ed3b72801eb3d1cd8) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Emit declarationMap

-   Updated dependencies [[`336876b`](https://github.com/learningeconomy/LearnCard/commit/336876b4b98e37157b8a133ed3b72801eb3d1cd8)]:
    -   @learncard/types@5.3.4

## 1.0.8

### Patch Changes

-   Updated dependencies [[`56aef2d`](https://github.com/learningeconomy/LearnCard/commit/56aef2d7830a5c66fa3b569b3c25eb3ecb6cc465)]:
    -   @learncard/types@5.3.3

## 1.0.7

### Patch Changes

-   [#320](https://github.com/learningeconomy/LearnCard/pull/320) [`46aeb32`](https://github.com/learningeconomy/LearnCard/commit/46aeb32c38e5e0246bc04ad9b06fa7d5011701f6) Thanks [@gerardopar](https://github.com/gerardopar)! - [WE-2801] - add additional VC fields

## 1.0.6

### Patch Changes

-   Updated dependencies [[`a0b62f3`](https://github.com/learningeconomy/LearnCard/commit/a0b62f351d32c4e0a788b519dd852aa5df9e6c8a)]:
    -   @learncard/types@5.3.2

## 1.0.5

### Patch Changes

-   Updated dependencies [[`23b48d7`](https://github.com/learningeconomy/LearnCard/commit/23b48d7b8221e6191d089735f13d925f69d3c800)]:
    -   @learncard/types@5.3.1

## 1.0.4

### Patch Changes

-   [#300](https://github.com/learningeconomy/LearnCard/pull/300) [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add isEncrypted

-   Updated dependencies [[`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209), [`2e80eb8`](https://github.com/learningeconomy/LearnCard/commit/2e80eb83fc5ee2b954b40cc020ad5c790b571209)]:
    -   @learncard/types@5.3.0

## 1.0.3

### Patch Changes

-   No change, just forcible version bump

## 1.0.2

### Patch Changes

-   [#249](https://github.com/learningeconomy/LearnCard/pull/249) [`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1) Thanks [@goblincore](https://github.com/goblincore)! - Republish

## 1.0.1

### Patch Changes

-   [#162](https://github.com/learningeconomy/LearnCard/pull/162) [`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Eject from aqu

## 1.0.0

### Major Changes

-   [#85](https://github.com/learningeconomy/LearnCard/pull/85) [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Create @learncard/helpers package
