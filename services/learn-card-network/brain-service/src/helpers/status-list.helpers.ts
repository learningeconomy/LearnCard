import { gzipSync, gunzipSync } from 'node:zlib';
import { v4 as uuid } from 'uuid';
import type {
    AllocatedBitstringStatusListEntry,
    BitstringStatusListEntry,
    BitstringStatusPurpose,
    UnsignedVC,
    VC,
} from '@learncard/types';
import { DEFAULT_BITSTRING_STATUS_LIST_SIZE } from '@learncard/types';
import {
    getBitstringStatusListEntries,
    getCredentialStatusArray,
    isVC2Format,
    setBitstringStatusListBit,
} from '@learncard/helpers';

import { neogma } from '@instance';
import { Credential } from '@models';
import type { StatusListPurpose, StatusListType } from '@models';
import { getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';

const hasToNumber = (value: unknown): value is { toNumber: () => number } =>
    !!value &&
    typeof value === 'object' &&
    typeof (value as { toNumber?: unknown }).toNumber === 'function';

const asNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (hasToNumber(value)) return value.toNumber();
    return Number(value);
};

const nodeToStatusList = (node: unknown): StatusListType | null => {
    const properties = (node as { properties?: Record<string, unknown> } | undefined)?.properties;
    if (!properties) return null;

    return {
        id: String(properties.id),
        ownerProfileId: String(properties.ownerProfileId),
        statusPurpose: properties.statusPurpose as StatusListPurpose,
        statusListCredential: String(properties.statusListCredential),
        size: asNumber(properties.size),
        nextIndex: asNumber(properties.nextIndex),
        encodedList: String(properties.encodedList),
        credential: String(properties.credential),
        created: String(properties.created),
        updated: String(properties.updated),
        closed: properties.closed === true,
    };
};

export const getStatusListBaseUrl = (domain: string): string => {
    const normalizedDomain = domain.replace('/trpc', '').replace(/%3A/g, ':');
    const protocol = normalizedDomain.includes('localhost') ? 'http' : 'https';

    return `${protocol}://${normalizedDomain}`;
};

export const getStatusListCredentialUrl = (id: string, domain: string): string =>
    `${getStatusListBaseUrl(domain)}/status-lists/${id}`;

const toBase64Url = (bytes: Buffer): string =>
    bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');

const fromBase64Url = (encoded: string): Buffer => {
    const padded = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(encoded.length / 4) * 4, '=');

    return Buffer.from(padded, 'base64');
};

export const encodeBitstring = (bitstring: Buffer): string =>
    `u${toBase64Url(gzipSync(bitstring))}`;

export const decodeBitstring = (encodedList: string, expectedBits: number): Buffer => {
    if (!encodedList.startsWith('u')) {
        throw new Error('Bitstring status list must use multibase base64url encoding');
    }

    const uncompressed = gunzipSync(fromBase64Url(encodedList.slice(1)));
    const expectedBytes = Math.ceil(expectedBits / 8);

    if (uncompressed.length < expectedBytes) {
        const padded = Buffer.alloc(expectedBytes);
        uncompressed.copy(padded);
        return padded;
    }

    return Buffer.from(uncompressed);
};

const getConfiguredStatusListSize = (requestedSize?: number): number => {
    const configuredSize = requestedSize ?? Number(process.env.BITSTRING_STATUS_LIST_SIZE);
    const parsedSize =
        Number.isFinite(configuredSize) && configuredSize > 0
            ? configuredSize
            : DEFAULT_BITSTRING_STATUS_LIST_SIZE;
    const roundedSize = Math.ceil(parsedSize);
    const allowSmallTestLists =
        process.env.NODE_ENV === 'test' && process.env.BITSTRING_STATUS_LIST_ALLOW_SMALL === 'true';

    return allowSmallTestLists
        ? roundedSize
        : Math.max(roundedSize, DEFAULT_BITSTRING_STATUS_LIST_SIZE);
};

const getEmptyEncodedList = (size: number): string =>
    encodeBitstring(Buffer.alloc(Math.ceil(size / 8)));

const buildUnsignedStatusListCredential = (
    list: Pick<StatusListType, 'statusListCredential' | 'statusPurpose' | 'encodedList'>
): UnsignedVC => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: list.statusListCredential,
    type: ['VerifiableCredential', 'BitstringStatusListCredential'],
    issuer: getStatusListIssuerDid(),
    validFrom: new Date().toISOString(),
    credentialSubject: {
        id: `${list.statusListCredential}#list`,
        type: 'BitstringStatusList',
        statusPurpose: list.statusPurpose,
        encodedList: list.encodedList,
    },
});

let statusListIssuerDid = '';

const getStatusListIssuerDid = (): string => {
    if (!statusListIssuerDid) {
        const domain =
            process.env.DOMAIN_NAME ||
            (process.env.IS_OFFLINE
                ? `localhost%3A${process.env.PORT || 3000}`
                : 'localhost%3A3000');
        statusListIssuerDid = `did:web:${domain}`;
    }

    return statusListIssuerDid;
};

const signStatusListCredential = async (
    list: Pick<StatusListType, 'statusListCredential' | 'statusPurpose' | 'encodedList'>
): Promise<VC> => {
    const learnCard =
        process.env.NODE_ENV === 'test' ? await getLearnCard() : await getDidWebLearnCard();
    const unsigned = {
        ...buildUnsignedStatusListCredential(list),
        issuer: learnCard.id.did(),
    };

    return learnCard.invoke.issueCredential(unsigned);
};

export const getStatusListById = async (id: string): Promise<StatusListType | null> => {
    const record = (
        await neogma.queryRunner.run(
            'MATCH (list:BitstringStatusList {id: $id}) RETURN list LIMIT 1',
            {
                id,
            }
        )
    ).records[0];

    return record ? nodeToStatusList(record.get('list')) : null;
};

const createStatusList = async (
    ownerProfileId: string,
    domain: string,
    statusPurpose: BitstringStatusPurpose,
    size: number
): Promise<StatusListType> => {
    const now = new Date().toISOString();
    const id = uuid();
    const statusListCredential = getStatusListCredentialUrl(id, domain);
    const encodedList = getEmptyEncodedList(size);
    const credential = await signStatusListCredential({
        statusListCredential,
        statusPurpose,
        encodedList,
    });

    const record = (
        await neogma.queryRunner.run(
            `MATCH (owner:Profile {profileId: $ownerProfileId})
             CREATE (list:BitstringStatusList {
                 id: $id,
                 ownerProfileId: $ownerProfileId,
                 statusPurpose: $statusPurpose,
                 statusListCredential: $statusListCredential,
                 size: $size,
                 nextIndex: 0,
                 encodedList: $encodedList,
                 credential: $credential,
                 created: $now,
                 updated: $now,
                 closed: false
             })
             CREATE (owner)-[:OWNS_STATUS_LIST]->(list)
             RETURN list`,
            {
                ownerProfileId,
                id,
                statusPurpose,
                statusListCredential,
                size,
                encodedList,
                credential: JSON.stringify(credential),
                now,
            }
        )
    ).records[0];

    const list = record ? nodeToStatusList(record.get('list')) : null;
    if (!list) throw new Error('Failed to create Bitstring status list');

    return list;
};

const getActiveStatusList = async (
    ownerProfileId: string,
    statusPurpose: BitstringStatusPurpose,
    size: number
): Promise<StatusListType | null> => {
    const record = (
        await neogma.queryRunner.run(
            `MATCH (:Profile {profileId: $ownerProfileId})-[:OWNS_STATUS_LIST]->(list:BitstringStatusList {
                 statusPurpose: $statusPurpose,
                 size: $size
             })
             WHERE coalesce(list.closed, false) = false AND list.nextIndex < list.size
             RETURN list
             ORDER BY list.created ASC
             LIMIT 1`,
            { ownerProfileId, statusPurpose, size }
        )
    ).records[0];

    return record ? nodeToStatusList(record.get('list')) : null;
};

const reserveStatusListIndex = async (
    listId: string
): Promise<{ list: StatusListType; statusListIndex: number } | null> => {
    const now = new Date().toISOString();
    const record = (
        await neogma.queryRunner.run(
            `MATCH (list:BitstringStatusList {id: $id})
             WHERE coalesce(list.closed, false) = false AND list.nextIndex < list.size
             SET list._allocationLock = $now
             REMOVE list._allocationLock
             WITH list
             WHERE list.nextIndex < list.size
             WITH list, list.nextIndex AS statusListIndex
             SET list.nextIndex = statusListIndex + 1,
                 list.updated = $now,
                 list.closed = statusListIndex + 1 >= list.size
             RETURN list, statusListIndex`,
            { id: listId, now }
        )
    ).records[0];

    const list = record ? nodeToStatusList(record.get('list')) : null;
    if (!list || !record) return null;

    return { list, statusListIndex: asNumber(record.get('statusListIndex')) };
};

export const allocateStatusListEntry = async (
    ownerProfileId: string,
    domain: string,
    statusPurpose: BitstringStatusPurpose,
    requestedSize?: number
): Promise<AllocatedBitstringStatusListEntry> => {
    const size = getConfiguredStatusListSize(requestedSize);
    let allocation: { list: StatusListType; statusListIndex: number } | null = null;

    for (let attempt = 0; attempt < 3 && !allocation; attempt += 1) {
        const list =
            (await getActiveStatusList(ownerProfileId, statusPurpose, size)) ??
            (await createStatusList(ownerProfileId, domain, statusPurpose, size));

        allocation = await reserveStatusListIndex(list.id);
    }

    if (!allocation) throw new Error('Failed to allocate Bitstring status list index');

    const { list, statusListIndex } = allocation;

    return {
        id: `${list.statusListCredential}#${statusListIndex}`,
        type: 'BitstringStatusListEntry',
        statusPurpose,
        statusListIndex: statusListIndex.toString(),
        statusListCredential: list.statusListCredential,
    };
};

export const appendBitstringStatusListEntries = async (
    credential: UnsignedVC,
    ownerProfileId: string,
    domain: string,
    statusPurposes: BitstringStatusPurpose[] = ['revocation']
): Promise<UnsignedVC> => {
    if (!isVC2Format(credential)) return credential;

    const existingStatuses = getCredentialStatusArray(credential);
    const entriesToAdd: AllocatedBitstringStatusListEntry[] = [];

    for (const statusPurpose of statusPurposes) {
        const alreadyHasPurpose = existingStatuses.some(status => {
            return (
                status.type === 'BitstringStatusListEntry' && status.statusPurpose === statusPurpose
            );
        });

        if (!alreadyHasPurpose) {
            entriesToAdd.push(await allocateStatusListEntry(ownerProfileId, domain, statusPurpose));
        }
    }

    if (entriesToAdd.length === 0) return credential;

    const credentialStatuses = [...existingStatuses, ...entriesToAdd];
    credential.credentialStatus = (
        credentialStatuses.length === 1 ? credentialStatuses[0] : credentialStatuses
    ) as UnsignedVC['credentialStatus'];

    return credential;
};

export const setStatusListEntryBit = async (
    entry: BitstringStatusListEntry,
    value: boolean
): Promise<boolean> => {
    const statusListIndex = Number(entry.statusListIndex);

    if (!Number.isInteger(statusListIndex) || statusListIndex < 0) {
        throw new Error('Bitstring status list index is out of range');
    }

    return neogma.getTransaction(null, async tx => {
        const record = (
            await tx.run(
                `MATCH (list:BitstringStatusList {statusListCredential: $statusListCredential})
                 SET list._statusListUpdateLock = $lockToken
                 REMOVE list._statusListUpdateLock
                 RETURN list
                 LIMIT 1`,
                {
                    statusListCredential: entry.statusListCredential,
                    lockToken: new Date().toISOString(),
                }
            )
        ).records[0];

        const list = record ? nodeToStatusList(record.get('list')) : null;
        if (!list) return false;

        if (statusListIndex >= list.size) {
            throw new Error('Bitstring status list index is out of range');
        }

        const bitstring = decodeBitstring(list.encodedList, list.size);
        setBitstringStatusListBit(bitstring, statusListIndex, value);

        const encodedList = encodeBitstring(bitstring);
        const credential = await signStatusListCredential({ ...list, encodedList });
        const now = new Date().toISOString();

        await tx.run(
            `MATCH (list:BitstringStatusList {id: $id})
             SET list.encodedList = $encodedList,
                 list.credential = $credential,
                 list.updated = $now`,
            {
                id: list.id,
                encodedList,
                credential: JSON.stringify(credential),
                now,
            }
        );

        return true;
    });
};

export const setCredentialBitstringStatus = async (
    credentialId: string,
    statusPurpose: BitstringStatusPurpose,
    value: boolean
): Promise<boolean> => {
    const credential = await Credential.findOne({ where: { id: credentialId } });
    if (!credential) return false;

    const parsedCredential = JSON.parse(credential.credential);
    const entries = getBitstringStatusListEntries(parsedCredential).filter(
        entry => entry.statusPurpose === statusPurpose
    );

    if (entries.length === 0) return false;

    await Promise.all(entries.map(entry => setStatusListEntryBit(entry, value)));

    return true;
};

export const getSignedStatusListCredential = async (id: string): Promise<VC | null> => {
    const list = await getStatusListById(id);
    if (!list) return null;

    return JSON.parse(list.credential) as VC;
};
