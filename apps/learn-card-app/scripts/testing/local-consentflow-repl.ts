#!/usr/bin/env npx tsx

import repl from 'node:repl';
import { inspect } from 'node:util';

import { getLCAPlugin } from '@learncard/lca-api-plugin';
import { initLearnCard } from '@learncard/init';

type ConsentFlowRecord = {
    contractUri?: string;
    credentials?:
        | Array<{ uri: string; category?: string }>
        | {
              categories?: Record<string, string[]>;
          };
};

type VerifiableDataSummary = {
    uri: string;
    name?: string;
    dataPayload?: unknown;
    skills?: string[];
};

type VerifiableDataSummaryGroup = {
    name: string;
    data: Array<{
        uri: string;
        name?: string;
    }>;
};

type VerifiableDataSummaryEntry = VerifiableDataSummary | VerifiableDataSummaryGroup;

const isWorkExperienceCredential = (credential: any): boolean =>
    credential?.type?.includes('BoostCredential') &&
    credential?.credentialSubject?.achievement?.achievementType === 'ext:Job';

const buildVerifiableDataSummaryEntry = (
    credentialUri: string,
    credential: any
): VerifiableDataSummaryEntry => {
    if (isWorkExperienceCredential(credential)) {
        return {
            name: 'Work Experience Credentials',
            data: [
                {
                    name: credential?.name ?? credential?.credentialSubject?.achievement?.name,
                    uri: credentialUri,
                },
            ],
        };
    }

    if (
        credential?.boostCredential?.credentialSubject?.achievement?.name === 'Self-Assigned Skills'
    ) {
        return {
            name: 'Self-Assigned Skills',
            skills: extractSelfAssignedSkills(credential),
            uri: credentialUri,
        };
    }

    return {
        name: getSummaryName(credential),
        dataPayload: credential?.credentialSubject?.dataPayload,
        uri: credentialUri,
    };
};

const extractSelfAssignedSkills = (credential: any): string[] | undefined => {
    const alignment = credential?.boostCredential?.credentialSubject?.achievement?.alignment;

    if (!Array.isArray(alignment) || alignment.length === 0) return undefined;

    const skills = alignment
        .map((item: { targetName?: string }) => item?.targetName)
        .filter((targetName: string | undefined): targetName is string => Boolean(targetName));

    return skills.length ? skills : undefined;
};

const getSummaryName = (credential: any): string | undefined => {
    if (
        credential?.boostCredential?.credentialSubject?.achievement?.name === 'Self-Assigned Skills'
    ) {
        return 'Self-Assigned Skills';
    }

    return credential?.name ?? credential?.credentialSubject?.achievement?.name;
};

const extractCredentialUris = (record: ConsentFlowRecord): string[] => {
    if (Array.isArray(record.credentials)) {
        return record.credentials.map(({ uri }) => uri).filter(Boolean);
    }

    const categories = record.credentials?.categories ?? {};

    return Object.values(categories).flatMap(categoryUris => categoryUris ?? []);
};

const seed = process.env.SEED ?? process.argv[2];
const contractUri = process.env.CONTRACT_URI ?? process.argv[3];
const profileId = process.env.PROFILE_ID ?? process.argv[4];
const profileDid =
    process.env.PROFILE_DID ??
    (profileId ? `did:web:localhost%3A4000:users:${profileId}` : undefined);

if (!seed || !contractUri) {
    throw new Error(
        'Usage: SEED=... CONTRACT_URI=... [PROFILE_ID=...] [PROFILE_DID=...] npx tsx scripts/local-consentflow-repl.ts'
    );
}

const main = async (): Promise<void> => {
    const baseLearnCard = await initLearnCard({
        seed,
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
        ...(profileDid ? { didWeb: profileDid } : {}),
        allowRemoteContexts: true,
    });

    const learnCard = await baseLearnCard.addPlugin(
        await getLCAPlugin(baseLearnCard, 'http://localhost:5100/trpc', Boolean(profileDid))
    );

    const fetchAllConsentFlowData = async (uri: string): Promise<ConsentFlowRecord[]> => {
        const records: ConsentFlowRecord[] = [];
        let cursor: string | null | undefined = undefined;

        for (;;) {
            const page = await learnCard.invoke.getConsentFlowData(uri, { limit: 100, cursor });
            records.push(...(page.records as ConsentFlowRecord[]));

            if (!page.hasMore) break;
            cursor = page.cursor;
        }

        return records;
    };

    const getVerifiableDataUris = async (uri = contractUri): Promise<string[]> => {
        const records = await fetchAllConsentFlowData(uri);

        return records.flatMap(record => extractCredentialUris(record));
    };

    const readVerifiableDataSummary = async (
        uri = contractUri
    ): Promise<VerifiableDataSummaryEntry[]> => {
        const data = await readVerifiableData(uri);

        const summaries: VerifiableDataSummaryEntry[] = [];

        for (const { uri: credentialUri, credential } of data) {
            if (isWorkExperienceCredential(credential)) {
                const existingGroup = summaries.find(
                    (entry): entry is VerifiableDataSummaryGroup =>
                        'data' in entry && entry.name === 'Work Experience Credentials'
                );

                if (existingGroup) {
                    existingGroup.data.push({
                        uri: credentialUri,
                        name: credential?.name ?? credential?.credentialSubject?.achievement?.name,
                    });
                } else {
                    summaries.push({
                        name: 'Work Experience Credentials',
                        data: [
                            {
                                uri: credentialUri,
                                name:
                                    credential?.name ??
                                    credential?.credentialSubject?.achievement?.name,
                            },
                        ],
                    });
                }

                continue;
            }

            summaries.push(buildVerifiableDataSummaryEntry(credentialUri, credential));
        }

        return summaries;
    };

    const readContract = async (uri = contractUri) => learnCard.invoke.getContract(uri);

    const readVerifiableData = async (uri = contractUri) => {
        const uris = await getVerifiableDataUris(uri);
        return Promise.all(
            uris.map(async credentialUri => ({
                uri: credentialUri,
                credential: await learnCard.read.get(credentialUri),
            }))
        );
    };

    const readFirstVerifiableData = async (uri = contractUri) => {
        const [firstUri] = await getVerifiableDataUris(uri);

        if (!firstUri) return undefined;

        return learnCard.read.get(firstUri);
    };

    const readUri = async (uri: string) => learnCard.read.get(uri);

    const initialRecords = await fetchAllConsentFlowData(contractUri);

    console.log('\nConsent records:\n');
    console.log(inspect(initialRecords, { depth: 6, colors: true }));

    console.log('\nAuthenticated DID:\n');
    console.log(learnCard.id.did());

    console.log('\nVerifiable data URIs:\n');
    console.log(await getVerifiableDataUris(contractUri));

    console.log('\nReady. Try:');
    console.log('  await readContract()');
    console.log('  await getVerifiableDataUris()');
    console.log('  await readVerifiableDataSummary()');
    console.log('  await readUri(uri)');
    console.log('  await readFirstVerifiableData()');
    console.log('  await readVerifiableData()');
    console.log('  await fetchAllConsentFlowData(contractUri)\n');
    console.log('To view the full credential use `readUri(uri)`\n');

    const server = repl.start({
        prompt: 'consentflow-local> ',
        terminal: true,
        useColors: true,
        writer: value => inspect(value, { depth: null, colors: true, compact: false }),
    });

    Object.assign(server.context, {
        seed,
        contractUri,
        profileId,
        profileDid,
        learnCard,
        fetchAllConsentFlowData,
        getVerifiableDataUris,
        readContract,
        readVerifiableDataSummary,
        readUri,
        readVerifiableData,
        readFirstVerifiableData,
    });
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
