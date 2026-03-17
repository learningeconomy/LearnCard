import {
    EC2Client,
    StartInstancesCommand,
    StopInstancesCommand,
    DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';

const ec2 = new EC2Client({});
const INSTANCE_ID = process.env.INSTANCE_ID;
const API_KEY = process.env.API_KEY;

export const handler = async (event) => {
    // Authenticate via x-api-key header
    const providedKey = event.headers?.['x-api-key'];

    if (!API_KEY || providedKey !== API_KEY) {
        return { statusCode: 403, body: 'Forbidden' };
    }

    const path = event.rawPath || '';

    if (path.endsWith('/start')) {
        await ec2.send(new StartInstancesCommand({ InstanceIds: [INSTANCE_ID] }));
        return { statusCode: 200, body: 'Starting instance' };
    }

    if (path.endsWith('/stop')) {
        await ec2.send(new StopInstancesCommand({ InstanceIds: [INSTANCE_ID] }));
        return { statusCode: 200, body: 'Stopping instance' };
    }

    if (path.endsWith('/status')) {
        const result = await ec2.send(
            new DescribeInstancesCommand({ InstanceIds: [INSTANCE_ID] })
        );

        const instance = result.Reservations?.[0]?.Instances?.[0];
        const state = instance?.State?.Name || 'unknown';
        const ip = instance?.PublicIpAddress || '';

        return {
            statusCode: 200,
            body: `State: ${state}\nPublic IP: ${ip}`,
        };
    }

    return { statusCode: 404, body: 'Not found. Valid paths: /start, /stop, /status' };
};
