#!/usr/bin/env bun
import * as dotenv from 'dotenv';

dotenv.config();
process.env.NEO4J_URI ??= 'bolt://localhost:7687';
process.env.NEO4J_USERNAME ??= 'neo4j';
process.env.NEO4J_PASSWORD ??= 'password';

const main = async (): Promise<void> => {
    const { neogma } = await import('@instance');
    const { suspendLegacySubjectBindings } = await import('@accesslayer/binding/migrate-preflight');
    try {
        console.log(
            `Suspended ${await suspendLegacySubjectBindings()} legacy subject-data bindings.`
        );
    } finally {
        await neogma.driver.close();
    }
};

main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
});
