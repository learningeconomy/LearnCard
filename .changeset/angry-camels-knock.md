---
'@learncard/network-brain-service': minor
'@learncard/network-plugin': minor
'@learncard/types': minor
'@learncard/helpers': patch
'@learncard/react': patch
---

Add comprehensive Skills & Skill Frameworks system to LearnCard Network

This introduces a complete skill taxonomy system spanning the LearnCard Network plugin, brain service, and shared types. Organizations can now create custom skill frameworks, organize skills hierarchically, attach frameworks to Boosts, and align specific skills to credentials.

## Core Features

### Skill Framework Management

- **Create Managed Frameworks**: Users can create skill frameworks with metadata (name, description, status)
- **Framework Ownership**: Frameworks are linked to profiles via `MANAGES` relationship for access control
- **Framework Queries**: List, search, and filter frameworks by various criteria
- **External Provider Sync**: Optional integration with external skills services

### Hierarchical Skill Organization

- **Create Skills**: Add individual skills with statement, description, and code to frameworks
- **Parent-Child Relationships**: Build skill hierarchies using `IS_CHILD_OF` relationships
- **Framework Containment**: Skills linked to frameworks via `CONTAINS` relationships
- **Bulk Operations**: Support for creating multiple skills and frameworks efficiently

### Boost Integration

- **Attach Frameworks**: Link skill frameworks to Boosts using `USES_FRAMEWORK` relationships
- **Skill Alignment**: Align specific skills to Boosts via `ALIGNED_TO` relationships
- **Ancestor Traversal**: Query skills from frameworks attached to a boost or its ancestors
- **Permission Checks**: Validates boost admin rights before allowing framework/skill operations

## API Methods Added

### Plugin Methods

- `createManagedSkillFramework()` - Create a new skill framework
- `createManagedSkillFrameworks()` - Bulk create frameworks
- `createSkill()` - Add a skill to a framework
- `createSkills()` - Bulk create skills
- `attachFrameworkToBoost()` - Link framework to boost
- `detachFrameworkFromBoost()` - Remove framework from boost
- `alignBoostSkills()` - Align specific skills to boost
- `getSkillsAvailableForBoost()` - Query alignable skills
- `searchSkillsAvailableForBoost()` - Search skills for boost
- `getBoostFrameworks()` - List frameworks attached to boost

### Brain Service Routes

- `skillFrameworks.createManaged` - Create framework with MANAGES relationship
- `skillFrameworks.listMine` - Query user's managed frameworks
- `skillFrameworks.update` - Update framework metadata
- `skills.create` - Create skills with hierarchy support
- `skills.update` - Update skill metadata
- `skills.searchFrameworkSkills` - Search within framework
- `boost.attachFrameworkToBoost` - Establish USES_FRAMEWORK relationship
- `boost.alignBoostSkills` - Create ALIGNED_TO relationships
- `boost.getSkillsAvailableForBoost` - Graph traversal for available skills

## Type System

### New Types & Validators

- `SkillFrameworkValidator` / `SkillFrameworkType` - Framework structure
- `SkillValidator` / `SkillType` - Individual skill structure
- `SkillFrameworkStatus` - Framework lifecycle states
- `CreateManagedSkillFrameworkInput` - Framework creation params
- `SkillFrameworkQuery` - Framework search parameters

## Graph Database Schema

### New Relationships

- `(Profile)-[:MANAGES]->(SkillFramework)` - Framework ownership
- `(SkillFramework)-[:CONTAINS]->(Skill)` - Framework-skill membership
- `(Skill)-[:IS_CHILD_OF]->(Skill)` - Hierarchical skill organization
- `(Boost)-[:USES_FRAMEWORK]->(SkillFramework)` - Framework attachment
- `(Boost)-[:ALIGNED_TO]->(Skill)` - Skill alignment for credentials

### Access Layer Methods

- `createSkillFrameworkNode()` - Persist framework with MANAGES relationship
- `createSkill()` - Create skill with CONTAINS and optional IS_CHILD_OF relationships
- `setBoostUsesFramework()` - Establish framework attachment
- `addAlignedSkillsToBoost()` - Batch create ALIGNED_TO relationships
- `getFrameworkSkillsAvailableForBoost()` - Traverse graph for available skills

This system enables rich skill-based credential metadata, allowing organizations to categorize and align credentials with industry-standard or custom skill taxonomies.
