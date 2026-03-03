import { getBespokeLearnCard, BespokeLearnCard } from './wallet.helpers';
import { Page } from '@playwright/test';

export const MOCK_APP_REGISTRY = {
    SMART_RESUME: {
        id: 'SmartResume',
        organization: {
            name: 'iDatify, LLC',
            address: '417 Main Street Little Rock, AR 72201',
        },
        url: 'https://www.smartresume.com/',
        did: 'did:web:network.learncard.com:users:smartresume',
        profileId: 'SmartResumeTestProfileId',
        app: {
            name: 'SmartResume',
            description: 'Job & Talent Marketplace',
            icon: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/MOIZPz1Tdylx7S094Hn3',
            connectUrl: 'https://my.smartresume.com/createmyresume/learncard',
            redirectUrl: 'https://www.smartresume.com/redirect',
            allowSendingAdditionalVPs: false,
            publicizeOnLaunchPad: true,
        },
    },
    APP2: {
        id: 'App2',
        organization: {
            name: 'App2, LLC',
            address: 'App2 Town, APT',
        },
        url: 'www.app2.com',
        did: 'did:web:network.learncard.com:users:app2',
        profileId: 'App2TestId',
        app: {
            name: 'App2 AppName',
            description: 'App2 Description',
            icon: 'https://lh3.googleusercontent.com/a/AEdFTp6tWt38nyKIGJ5m9y1_j-tTcn8QMT_EtEKiltBM=s96-c',
            connectUrl: 'www.app2.com/connect',
            redirectUrl: 'www.app2.com/redirect',
            allowSendingAdditionalVPs: true,
            publicizeOnLaunchPad: true,
        },
    },
    APP3: {
        id: 'App3',
        organization: {
            name: 'App3, LLC',
            address: 'App3 Town, APT',
        },
        url: 'www.app3.com',
        did: 'did:web:network.learncard.com:users:app3',
        profileId: 'App3TestId',
        app: {
            name: 'App3 AppName',
            description: 'App3 Description',
            icon: 'https://images.unsplash.com/photo-1645680827507-9f392edae51c',
            connectUrl: 'www.app3.com/connect',
            redirectUrl: 'www.app3.com/redirect',
            allowSendingAdditionalVPs: false,
            publicizeOnLaunchPad: false,
        },
    },
};

// this is the credential that the test account owns
export const testAchievementCredential = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    id: 'http://example.com/credentials/3527',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
    issuanceDate: '2023-02-17T21:44:12.103Z',
    credentialSubject: {
        id: 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
        type: ['AchievementSubject'],
        achievement: {
            id: 'https://example.com/achievements/21st-century-skills/teamwork',
            name: 'test',
            type: ['Achievement'],
            criteria: {
                narrative: 'test',
            },
            description: 'test',
            achievementType: 'Achievement',
        },
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2023-02-17T21:44:12.112Z',
        proofPurpose: 'assertionMethod',
        verificationMethod:
            'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        proofValue:
            'z4k8m1baym2SfyjMdLgvzZ4KzHqxnVDLoCURTKMTGZrbVAzQxjTvChGyr1CfkjLpEGWHjx5CDPqJyZyE6MKMLSqYc',
    },
    name: 'test',
};

export const mockRoutes = async (page: Page) => {
    await page.route(
        'https://raw.githubusercontent.com/learningeconomy/registries/main/learncard/trusted-app-registry.json',
        async route => {
            await route.fulfill({ json: Object.values(MOCK_APP_REGISTRY) });
        }
    );

    await page.route(MOCK_APP_REGISTRY.SMART_RESUME.app.connectUrl, async (route, request) => {
        const { profileId, inviteChallenge } = await getSmartResumeProfileIdAndChallenge();

        const redirectUrl = `https://localhost:3000/launchpad?connectTo=${encodeURI(
            profileId
        )}&challenge=${inviteChallenge.challenge}`;

        // SHOULD work for webkit, but doesn't
        //   https://github.com/microsoft/playwright/issues/1489#issuecomment-728230606
        // route.continue({ url: redirectUrl });

        const headers = { ...request.headers(), Location: redirectUrl };
        route.fulfill({
            status: 303, // works for chrome + firefox, not webkit
            headers,
        });
    });

    // TODO figure out how to return mock credentials. Here's a starter...
    await page.route(
        'https://ceramic-node.welibrary.io:7007/api/v0/multiqueries',
        async (route, request) => {
            /* console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥 multiqueries intercepted');
            console.log('request.url():', request.url());
            console.log('request.postDataJSON():', request.postDataJSON()); */

            const postData = request.postDataJSON();

            const isIndexAllGet = postData.queries[0].streamId.startsWith('ceramic'); // wallet.index.all.get()
            if (isIndexAllGet) {
                // console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆 THIS IS THE ONE');
                const indexAllGetResponse = {
                    k2t6wyfsu4pfxk4vz5ffs0rbg31fz3lz64c86h35dppvk77le4097ivo1kqv02: {
                        type: 0,
                        content: {
                            credentials: [
                                {
                                    id: 'd5b982c2-4a0d-4312-9841-0b1847058b5a',
                                    uri: 'lc:ceramic:kjzl6cwe1jw146sll2uxf72bb9btqvyu8emqrbr2bwvdiyrl6bde8tanf64raxu', // uri that maps to read
                                    category: 'Achievement',
                                },
                            ],
                            jobs: [
                                {
                                    pin: '7762',
                                    uri: 'lc:ceramic:kjzl6cwe1jw14b52xe0q0xrkcgj2lxab4kgqyad83znamxniu30d8up84hybmfi',
                                    jobId: 1,
                                    randomSeed:
                                        'b0b02cf2b79612f7b03a286778b91a003621b3605c30a99d032ddd85d13b',
                                },
                                {
                                    pin: '7762',
                                    uri: 'lc:ceramic:kjzl6cwe1jw14b52xe0q0xrkcgj2lxab4kgqyad83znamxniu30d8up84hybmfi',
                                    jobId: 1,
                                    randomSeed:
                                        'b0b02cf2b79612f7b03a286778b91a003621b3605c30a99d032ddd85d13b',
                                },
                            ],
                        },
                        metadata: {
                            family: 'kjzl6cwe1jw14am5tu5hh412s19o4zm8aq3g2lpd6s4paxj2nly2lj4drp3pun2',
                            controllers: [
                                'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                            ],
                            schema: 'ceramic://k3y52l7qbv1frxkcwfpyauky3fyl4n44izridy3blvjjzgftis40sk9w8g3remghs',
                        },
                        signature: 2,
                        anchorStatus: 'ANCHORED',
                        log: [],
                        anchorProof: {
                            root: 'bafyreigkbovwpzn7qgj2t2vaynitltobn2y3qffgfd52dlvszed5tw7ffq',
                            txHash: 'bagjqcgzaqkgsqmxog4fcwbusokm6r2cyxpu2ohduyl2zudfxugsd6sg5xpkq',
                            txType: 'f(bytes32)',
                            chainId: 'eip155:1',
                        },
                        doctype: 'tile',
                    },
                };
                await route.fulfill({ json: indexAllGetResponse });
            } else if (
                // wallet.read.get('kjzl6....')
                postData.queries[0].streamId ===
                'kjzl6cwe1jw146sll2uxf72bb9btqvyu8emqrbr2bwvdiyrl6bde8tanf64raxu'
            ) {
                // console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆 Read call');
                const thisTestCredentialResponse = {
                    kjzl6cwe1jw146sll2uxf72bb9btqvyu8emqrbr2bwvdiyrl6bde8tanf64raxu: {
                        type: 0,
                        content: {
                            iv: 'FcP3SLzwUab3cPnHXYAKbZR0bBZpmWpI',
                            tag: 'VGPnAfktcLQuOSWnHqbe1g',
                            protected: 'eyJlbmMiOiJYQzIwUCJ9',
                            ciphertext:
                                'B1HfqcPxRXwo8juP28KYc4pMnAKeKTx3IlocliqHQzBo1WviuYcbzCtQhqPOKi0uXHqgLfpy7KW8CjMZ_thj-Xrdmkb3sjxpsJUObFZaljigLZKKxPV7vzNuFjIoi_XvtMFtN1Sjh289ndXoX503TgEt3U1ftQuv7nABC51Dc7pVkRzSmYrEkqx4si90qv4aGcd5cCtkWxWcQcMN8bv0PcMnaUT9MIZBneaHlfOAD3sHDxpt5i6rwN3nERqxuYEHfj0p255oT5sqRAT-_MQiGeAnuoMQzE7FRdLJyFqoaK9CW9iLnC56A-X-20dY08F1jbISgjPbX39t8fYUVSczQ5FtY66pdjZConL6t0a1GurBCH0f2o0Z_p-n0uLPeG8EVJVIQwb8skPBlB1WFaZDM-X57SNssxICU4TxSxj8u2D2CkuWtpCZspx_JCUFXdGnCfikL3Y4BM9jsmZ9gai30cCgIPAJTcwRwOcEiljiJN3HKvbQ55cC0QgxqkNA3mcX7Uhjt3Ozxhqmw1gtYmas_BhLFarIWetKZmMzfERDBfXkXRQlvIHhC3969-pSp5lxDj8zdmzk8wZYZEbro2KuvllBttVl5EkgwKNOubiP7X4sy6RuismALKxzq6jqgcKCwqfM8av4MIo0w6qa4YQ6YIKX8_BZbVptwutB5m02SV0QfmM78-BAKWLMZ2FYybNIz6wWhGoRXArTOMdw9ePXnxsTNuyqYt8UjL4XNkHZQwCX-btYFSRJuBaR-4MHWS3ObRsM55WFrHpXLXlKMv7VgHz-TF5UIDGUBmHN-sKFi4-VcOsCuZRK7aGNGsXku79QUFs_WWLtao_xiab7dhoRj53qxLL6FW1bAW7eqY90HheDsh1cBxrb6vHLGknD9f_zm0m0_KMRLXuWzcLpzlK4mmdcl-iDGhJclGOyAphYzHAaOArHNJkUw9ZvADCpHcZxESu19mXcYW8Xfb2zgMtsPXwmFB11fFMJtO2thcztpi-yCTCPEBIFefBZAXVeuemAaox7yzgNvEtzgN7hHFhu21RofZuSIneYnxKY9yaeJB1cakQ731Dr3Hof9e_xP1S-K3Ka8wChk25ddF3bVscP14Bdeh2UOm6biSHLKdOtmQcSBQWR4VacUPP6LI9zV9RAE6Mer-EpdN1BMbd41V3PvZhZf_oL3k7FZu_RDTivDVDNprqtIJnPntlUFUmUxDDiYqFgOggXa1YIgIvBunyiC_dUygvIiCUQH-iBuwbb7SwIJCzKjgPhsNCk8OnyfB9otUCCcex0Poj-2nyJlsl-UR79Ma2MlTXG',
                            recipients: [
                                {
                                    header: {
                                        iv: '9CG2eNdH-kdh9meaAzrDPCevIC1Wd6_6',
                                        alg: 'ECDH-ES+XC20PKW',
                                        epk: {
                                            x: 'j3DOMBf_N__ZlFOUrn0zGAnqEwWcJlWpmDVf7aH6jXo',
                                            crv: 'X25519',
                                            kty: 'OKP',
                                        },
                                        kid: 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6LSmBnb8nGVLxHrX3df63f1J9UH4xWJrajRakDcaMeUFpiK',
                                        tag: 'N0n27xfcAEPi95QcytvHWQ',
                                    },
                                    encrypted_key: 'USvTL0LQbN-ai-3HabJvIhLlL-DZh6HG0NRk3TAg8KE',
                                },
                            ],
                        },
                        metadata: {
                            family: 'SuperSkills',
                            unique: 'm3qr30Iydqdz5oKZ',
                            controllers: [
                                'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                            ],
                        },
                        signature: 2,
                        anchorStatus: 'ANCHORED',
                        log: [
                            {
                                cid: 'bagcqceraht5yirgkwww4tm4nsuk6afkbfsemgtxl53c7nsx5nchbhthbpqra',
                                type: 0,
                                timestamp: 1676671451,
                            },
                            {
                                cid: 'bafyreiadiahb6inugaseonakz4ge6lss4hry2af4kid5h4u5zbsbijzhky',
                                type: 2,
                                timestamp: 1676671451,
                            },
                        ],
                        anchorProof: {
                            root: 'bafyreigkbovwpzn7qgj2t2vaynitltobn2y3qffgfd52dlvszed5tw7ffq',
                            txHash: 'bagjqcgzaqkgsqmxog4fcwbusokm6r2cyxpu2ohduyl2zudfxugsd6sg5xpkq',
                            txType: 'f(bytes32)',
                            chainId: 'eip155:1',
                        },
                        doctype: 'tile',
                    },
                };
                route.fulfill({ json: thisTestCredentialResponse });
            } else {
                route.continue();
            }
        }
    );
    await page.route('https://network.learncard.com/**', async (route, request) => {
        /* console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨ network learncard intercepted');
        console.log('request.url():', request.url()); */
        route.continue();
    });
};

export const getSmartResumeLearnCard = async () => {
    return getBespokeLearnCard('aaabbbccc111222333');
};

export const getUnknownAppLearnCard = async () => {
    return getBespokeLearnCard('aaabbbccc111222333222');
};

const initAppProfile = async (
    appLearnCard: BespokeLearnCard,
    profileId: string,
    displayName: string
) => {
    const profile = await appLearnCard.invoke.getProfile();
    if (!profile) {
        await appLearnCard.invoke.createServiceProfile({
            profileId,
            displayName,
            shortBio: '',
            bio: '',
        });
    }
};

const generateChallengeForApp = async (
    getLearnCard: () => Promise<BespokeLearnCard>,
    profileId: string,
    displayName: string
) => {
    const appLearnCard = await getLearnCard();

    await initAppProfile(appLearnCard, profileId, displayName);

    const _profileId = (await appLearnCard.invoke.getProfile())?.profileId ?? '';
    const inviteChallenge = await appLearnCard.invoke.generateInvite();

    console.log({ inviteChallenge });

    return { profileId: _profileId, inviteChallenge };
};

export const getSmartResumeProfileIdAndChallenge = async () => {
    // Smart Resume creates a challenge string using their LC
    return await generateChallengeForApp(
        getSmartResumeLearnCard,
        'smartresumetestprofileid',
        'SmartResume Test'
    );
};

export const UNKNOWN_APP = {
    profileId: 'unknowntestapp',
    displayName: 'Unknown Test App',
};
export const getUnknownAppProfileIdAndChallenge = async () => {
    return await generateChallengeForApp(
        getUnknownAppLearnCard,
        UNKNOWN_APP.profileId,
        UNKNOWN_APP.displayName
    );
};

export const getCredentialsSharedWithSmartResume = async () => {
    const srLearnCard = await getSmartResumeLearnCard();
    const sharedCreds = await srLearnCard.invoke.getIncomingPresentations('test');

    if (sharedCreds.length === 0) return [];

    const mostRecentBundle = sharedCreds[0];
    const bundle = await srLearnCard.invoke.resolveFromLCN(mostRecentBundle.uri);
    const decrypted = await srLearnCard.invoke.decryptDagJwe<any>(bundle as any);

    return decrypted.verifiableCredential;
};
