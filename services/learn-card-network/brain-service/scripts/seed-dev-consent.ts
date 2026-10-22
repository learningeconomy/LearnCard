#!/usr/bin/env bun
import * as dotenv from 'dotenv';

dotenv.config();
process.env.NEO4J_URI ??= 'bolt://localhost:7687';
process.env.NEO4J_USERNAME ??= 'neo4j';
process.env.NEO4J_PASSWORD ??= 'password';
process.env.DOMAIN_NAME ??= 'localhost%3A4000';

const main = async (): Promise<void> => {
    if (process.env.NODE_ENV === 'production') throw new Error('Consent fixtures are dev-only.');
    const { neogma } = await import('@instance');
    const { seedDevGovernanceConsent } = await import('@accesslayer/consentflowcontract/dev-seed');
    try {
        await seedDevGovernanceConsent();
        console.log(
            'Synthetic governance contracts and operator acceptance seeded. No learner consent created.'
        );
    } finally {
        await neogma.driver.close();
    }
};

main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
});
