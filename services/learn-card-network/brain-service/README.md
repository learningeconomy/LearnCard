# Brain Service

This service exposes the LearnCard Network API and local Neo4j-backed skills flows.

## Skill framework seeding

-   **Auto-bootstrap**: on local/dev startup, if no `SkillFramework` nodes exist, the service seeds a default public set owned by the `network-seed` profile.
-   **Disable auto-bootstrap**: set `SKIP_SKILL_FRAMEWORK_SEED=true`.
-   **Re-seed manually**: run `pnpm skill-frameworks seed [local|staging]` from `services/learn-card-network/brain-service`.
-   **Add an admin**: run `pnpm skill-frameworks add-admin [local|staging]` and enter the profile id when prompted.
-   **Default environment**: if you omit the stage, the command defaults to `local` and prints a note.
-   **Production safety**: the manual seed command still refuses to run in production unless `--force` is provided.

## Notes

-   The default fixture is idempotent by framework and skill ID, so running the seed command multiple times does not duplicate data.
-   Seeded skills are compatible with the existing skill search, boost alignment, and OBv3 alignment flows.
