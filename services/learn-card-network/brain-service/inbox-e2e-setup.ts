import { Neo4jContainer } from '@testcontainers/neo4j';
import { GenericContainer } from 'testcontainers';
import type { TestProject } from 'vitest/node';
import { fileURLToPath } from 'node:url';
import { SQSClient, CreateQueueCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

/** Random host ports and fresh containers keep these tests away from development data. */
export default async function setup({ provide }: TestProject): Promise<() => Promise<void>> {
    const neo4j = await new Neo4jContainer('neo4j:5').start();
    try {
        const redis = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();
        let sqs: Awaited<ReturnType<GenericContainer['start']>> | undefined;
        try {
            sqs = await new GenericContainer('softwaremill/elasticmq-native:1.6.15')
                .withCopyFilesToContainer([
                    {
                        source: fileURLToPath(new URL('./inbox-elasticmq.conf', import.meta.url)),
                        target: '/opt/elasticmq.conf',
                    },
                ])
                .withExposedPorts(9324)
                .start();
            const endpoint = `http://${sqs.getHost()}:${sqs.getMappedPort(9324)}`;
            const client = new SQSClient({
                endpoint,
                region: 'us-east-1',
                credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
            });
            try {
                const dlq = await client.send(
                    new CreateQueueCommand({ QueueName: 'inbox-e2e-dlq' })
                );
                const dlqUrl = `${endpoint}${new URL(dlq.QueueUrl!).pathname}`;
                const attributes = await client.send(
                    new GetQueueAttributesCommand({
                        QueueUrl: dlqUrl,
                        AttributeNames: ['QueueArn'],
                    })
                );
                const queue = await client.send(
                    new CreateQueueCommand({
                        QueueName: 'inbox-e2e',
                        Attributes: {
                            VisibilityTimeout: '1800',
                            RedrivePolicy: JSON.stringify({
                                deadLetterTargetArn: attributes.Attributes!.QueueArn,
                                maxReceiveCount: '5',
                            }),
                        },
                    })
                );
                provide('inbox-queue-endpoint', endpoint);
                provide('inbox-queue-url', `${endpoint}${new URL(queue.QueueUrl!).pathname}`);
                provide('inbox-dead-letter-url', dlqUrl);
            } finally {
                client.destroy();
            }
        } catch (error) {
            await Promise.all([redis.stop(), sqs?.stop()]);
            throw error;
        }
        provide('neo4j-uri', neo4j.getBoltUri());
        provide('neo4j-password', neo4j.getPassword());
        provide('inbox-redis-host', redis.getHost());
        provide('inbox-redis-port', redis.getMappedPort(6379));
        return async () => {
            await Promise.all([redis.stop(), neo4j.stop(), sqs?.stop()]);
        };
    } catch (error) {
        await neo4j.stop();
        throw error;
    }
}
