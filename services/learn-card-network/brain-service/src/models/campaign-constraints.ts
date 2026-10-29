import { neogma } from '@instance';

let readiness: Promise<void> | undefined;

/** Await uniqueness before accepting creates, even during concurrent cold starts. */
export const ensureCampaignConstraints = (): Promise<void> => {
    readiness ??= neogma.queryRunner
        .run(
            'CREATE CONSTRAINT campaign_id_unique IF NOT EXISTS FOR (c:Campaign) REQUIRE c.id IS UNIQUE'
        )
        .then(() => undefined)
        .catch((error: unknown) => {
            if (
                (error as { code?: string })?.code ===
                'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists'
            )
                return;
            readiness = undefined;
            throw error;
        });
    return readiness;
};
