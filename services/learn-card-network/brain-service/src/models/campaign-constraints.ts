import { neogma } from '@instance';

let readiness: Promise<void> | undefined;

/** Await uniqueness before accepting creates, even during concurrent cold starts. */
export const ensureCampaignConstraints = (): Promise<void> => {
    readiness ??= Promise.all(
        [
            'CREATE CONSTRAINT campaign_id_unique IF NOT EXISTS FOR (c:Campaign) REQUIRE c.id IS UNIQUE',
            'CREATE CONSTRAINT campaign_unsubscribe_id_unique IF NOT EXISTS FOR (p:Profile) REQUIRE p.campaignUnsubscribeId IS UNIQUE',
        ].map(query =>
            neogma.queryRunner.run(query).catch((error: unknown) => {
                if (
                    (error as { code?: string })?.code !==
                    'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists'
                )
                    throw error;
            })
        )
    )
        .then(() => undefined)
        .catch((error: unknown) => {
            readiness = undefined;
            throw error;
        });
    return readiness;
};
