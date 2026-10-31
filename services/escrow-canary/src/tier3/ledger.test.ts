import { describe, expect, it, vi } from 'vitest';
import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand,
    TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
    createDynamoLedger,
    createMemoryLedger,
    keys,
    LedgerConflictError,
    replace,
    type LedgerItem,
} from './ledger';

const meta: LedgerItem = {
    ...keys.meta,
    type: 'meta',
    env: 'staging',
    version: 1,
    updatedAt: 1,
    enabledAt: 1,
    paused: false,
};

describe('tier 3 ledger', () => {
    it('memory ledger enforces create-if-absent and version compare-and-swap atomically', async () => {
        const ledger = createMemoryLedger();
        await ledger.write([{ kind: 'create', item: meta }]);
        await expect(ledger.write([{ kind: 'create', item: meta }])).rejects.toBeInstanceOf(
            LedgerConflictError
        );
        const stale = replace(meta, { paused: true }, 2);
        await ledger.write([stale]);
        await expect(ledger.write([stale])).rejects.toBeInstanceOf(LedgerConflictError);
        // A failing member aborts the whole transaction.
        const pool: LedgerItem = {
            ...keys.pool('hold-01'),
            type: 'pool',
            env: 'staging',
            version: 1,
            updatedAt: 1,
            label: 'hold-01',
            state: 'idle',
            stateSince: 1,
            lastReturnedAt: 0,
            orphanCleanupAttempted: false,
        };
        await expect(ledger.write([{ kind: 'create', item: pool }, stale])).rejects.toBeInstanceOf(
            LedgerConflictError
        );
        expect(await ledger.get(keys.pool('hold-01'))).toBeUndefined();
    });

    it('uses conditional single puts and transactions, mapping condition failures to conflicts', async () => {
        const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
        const send = vi.spyOn(client, 'send').mockImplementation(async () => ({}));
        const ledger = createDynamoLedger('table', client);
        await ledger.write([{ kind: 'create', item: meta }]);
        await ledger.write([
            replace(meta, { paused: true }, 2),
            { kind: 'create', item: { ...meta, pk: 'X' } },
        ]);
        const put = send.mock.calls[0][0] as PutCommand;
        expect(put).toBeInstanceOf(PutCommand);
        expect(put.input).toMatchObject({
            TableName: 'table',
            ConditionExpression: 'attribute_not_exists(pk)',
        });
        const transaction = send.mock.calls[1][0] as TransactWriteCommand;
        expect(transaction).toBeInstanceOf(TransactWriteCommand);
        expect(transaction.input.TransactItems![0].Put).toMatchObject({
            ConditionExpression: '#v = :v',
            ExpressionAttributeValues: { ':v': 1 },
        });
        send.mockImplementationOnce(async () => {
            throw new ConditionalCheckFailedException({ message: 'x', $metadata: {} });
        });
        await expect(ledger.write([{ kind: 'create', item: meta }])).rejects.toBeInstanceOf(
            LedgerConflictError
        );
    });

    it('scans the whole table with strong consistency and pagination', async () => {
        const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
        const send = vi
            .spyOn(client, 'send')
            .mockImplementationOnce(async () => ({
                Items: [meta],
                LastEvaluatedKey: { pk: 'META', sk: 'META' },
            }))
            .mockImplementationOnce(async () => ({ Items: [{ ...meta, pk: 'X' }] }));
        const items = await createDynamoLedger('table', client).scanAll();
        expect(items).toHaveLength(2);
        expect(send.mock.calls[0][0]).toBeInstanceOf(ScanCommand);
        expect((send.mock.calls[0][0] as ScanCommand).input.ConsistentRead).toBe(true);
        expect((send.mock.calls[1][0] as ScanCommand).input.ExclusiveStartKey).toEqual({
            pk: 'META',
            sk: 'META',
        });
    });

    it('never writes undefined attributes and rejects malformed items before writing', async () => {
        const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
        const send = vi.spyOn(client, 'send').mockImplementation(async () => ({}));
        const ledger = createDynamoLedger('table', client);
        await ledger.write([replace(meta, { pausedAt: undefined }, 2)]);
        expect(Object.keys((send.mock.calls[0][0] as PutCommand).input.Item!)).not.toContain(
            'pausedAt'
        );
        await expect(
            ledger.write([
                { kind: 'create', item: { ...meta, secret: 'x' } as unknown as LedgerItem },
            ])
        ).rejects.toThrow();
        expect(send).toHaveBeenCalledTimes(1);
    });
});
