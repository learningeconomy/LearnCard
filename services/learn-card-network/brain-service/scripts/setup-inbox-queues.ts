import {
    SQSClient,
    CreateQueueCommand,
    GetQueueUrlCommand,
    GetQueueAttributesCommand,
    SetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';

const endpoint = process.env.INBOX_QUEUE_ENDPOINT ?? 'http://localhost:9324';
const client = new SQSClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

const ensureQueue = async (name: string): Promise<string> => {
    let url: string | undefined;
    try {
        url = (await client.send(new GetQueueUrlCommand({ QueueName: name }))).QueueUrl;
    } catch (error) {
        if (
            !(error instanceof Error) ||
            !['QueueDoesNotExist', 'AWS.SimpleQueueService.NonExistentQueue'].includes(error.name)
        )
            throw error;
        url = (await client.send(new CreateQueueCommand({ QueueName: name }))).QueueUrl;
    }
    if (!url) throw new Error(`Missing URL for ${name}`);
    // ElasticMQ may advertise its container hostname; use the caller's reachable endpoint.
    return `${endpoint.replace(/\/$/, '')}${new URL(url).pathname}`;
};

try {
    const dlqUrl = await ensureQueue('inbox-dlq');
    const attributes = await client.send(
        new GetQueueAttributesCommand({
            QueueUrl: dlqUrl,
            AttributeNames: ['QueueArn'],
        })
    );
    if (!attributes.Attributes?.QueueArn)
        throw new Error('Inbox dead-letter queue ARN is missing.');
    const queueUrl = await ensureQueue('inbox');
    await client.send(
        new SetQueueAttributesCommand({
            QueueUrl: queueUrl,
            Attributes: {
                VisibilityTimeout: '1800',
                RedrivePolicy: JSON.stringify({
                    deadLetterTargetArn: attributes.Attributes.QueueArn,
                    maxReceiveCount: '5',
                }),
            },
        })
    );
    console.log(`INBOX_QUEUE_URL=${queueUrl}`);
    console.log(`INBOX_DEAD_LETTER_QUEUE_URL=${dlqUrl}`);
} finally {
    client.destroy();
}
