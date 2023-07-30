import { z } from 'zod';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import { getChallenges } from '@helpers/challenges.helpers';

import { t, openRoute, didRoute } from '@routes';
import { setValidChallengeForDid } from '@cache/challenges';

import packageJson from '../../package.json';

const sqs = new SQSClient({ apiVersion: 'latest', region: process.env.AWS_REGION });

export const utilitiesRouter = t.router({
    healthCheck: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/health-check',
                tags: ['Utilities'],
                summary: 'Check health of endpoint',
                description: 'Check if the endpoint is healthy and well',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async () => {
            const command = new SendMessageCommand({
                QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
                MessageBody: `{ nice: 'lol' }`,
            });

            const res = await sqs.send(command);

            console.log({ res });

            return `Healthy and well! (Version ${packageJson.version})`;
        }),

    getChallenges: didRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/challenges',
                tags: ['Utilities'],
                summary: 'Request a list of valid challenges',
                description:
                    'Generates an arbitrary number of valid challenges for a did, then returns them',
            },
        })
        .input(z.object({ amount: z.number().int().positive().lte(100).default(100) }).default({}))
        .output(z.string().array())
        .query(async ({ input, ctx }) => {
            const challenges = getChallenges(input.amount);

            const did = ctx.user.did;

            await Promise.all(
                challenges.map(async challenge => setValidChallengeForDid(did, challenge))
            );

            return challenges;
        }),

    getDid: didRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/did',
                tags: ['Utilities'],
                summary: 'Get LCN Did',
                description: 'Gets the did:web for the LCN itself',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async ({ ctx }) => `did:web:${ctx.domain}`),
});
export type UtilitiesRouter = typeof utilitiesRouter;
