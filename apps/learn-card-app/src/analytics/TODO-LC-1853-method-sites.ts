/**
 * LC-1853: profile_item_added method site TODOs.
 *
 * The following ProfileBuildMethod enum values are defined in events.ts but
 * their call sites need to be wired when the corresponding features are built:
 *
 * - ResumeImport: No resume-parsing → credential-import flow exists yet.
 *   When a "parse resume and create credentials" feature is added, add the
 *   PROFILE_ITEM_ADDED event with method: ProfileBuildMethod.ResumeImport.
 *   See: apps/learn-card-app/src/components/resume-builder/
 */
