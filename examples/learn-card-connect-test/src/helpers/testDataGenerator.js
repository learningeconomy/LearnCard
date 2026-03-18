import { initLearnCard } from '@learncard/init';

const TEST_ACCOUNT_EMAIL = 'demo@learningeconomy.io';
const PARTNER_SEED = 'abcabc';
const NETWORK_URL = 'http://localhost:4000/trpc';
const CLOUD_URL = 'http://localhost:4100/trpc';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function generatePK(str) {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export async function generateTestData(updateStatus) {
    updateStatus('🔑 Generating seeds...');

    const testAccountSeed = await generatePK(TEST_ACCOUNT_EMAIL);
    updateStatus(`✅ Test account seed generated (${testAccountSeed.substring(0, 16)}...)`);

    updateStatus('🔐 Initializing wallets...');

    const testWallet = await initLearnCard({
        seed: testAccountSeed,
        network: NETWORK_URL,
        cloud: { url: CLOUD_URL },
    });

    const partnerWallet = await initLearnCard({
        seed: PARTNER_SEED,
        network: NETWORK_URL,
        cloud: { url: CLOUD_URL },
    });

    updateStatus('✅ Wallets initialized');

    const testDid = testWallet.id.did();
    const partnerDid = partnerWallet.id.did();

    updateStatus(`📝 Test account DID: ${testDid.substring(0, 30)}...`);
    updateStatus(`📝 Partner DID: ${partnerDid.substring(0, 30)}...`);

    updateStatus('👤 Creating LCN profiles...');

    try {
        const existingTestProfile = await testWallet.invoke.getProfile();
        if (!existingTestProfile) {
            await testWallet.invoke.createProfile({
                profileId: 'test-demo-user',
                displayName: 'Test Demo User',
                bio: 'Test user for LearnCard Connect',
                shortBio: 'Test user',
            });
            updateStatus('✅ Test account profile created');
        } else {
            updateStatus('ℹ️ Test account profile already exists');
        }
    } catch (error) {
        if (error.message?.includes('already exists')) {
            updateStatus('ℹ️ Test account profile already exists');
        } else {
            throw error;
        }
    }

    try {
        const existingPartnerProfile = await partnerWallet.invoke.getProfile();
        if (!existingPartnerProfile) {
            await partnerWallet.invoke.createProfile({
                profileId: 'test-partner-app',
                displayName: 'Test Partner App',
                bio: 'Test partner app for LearnCard Connect',
                shortBio: 'Test partner',
            });
            updateStatus('✅ Partner profile created');
        } else {
            updateStatus('ℹ️ Partner profile already exists');
        }
    } catch (error) {
        if (error.message?.includes('already exists')) {
            updateStatus('ℹ️ Partner profile already exists');
        } else {
            throw error;
        }
    }

    await sleep(1000);

    updateStatus('📋 Creating consent flow contract...');

    const contract = {
        read: {
            personal: { name: { required: false } },
            credentials: {
                categories: {
                    Achievement: { required: false },
                    Course: { required: false },
                    ID: { required: false },
                },
            },
        },
        write: {
            personal: {},
            credentials: {
                categories: {},
            },
        },
    };

    let contractUri;
    try {
        contractUri = await partnerWallet.invoke.createConsentFlowContract({
            contract,
            name: 'Test Partner App Contract',
        });
        updateStatus(`✅ Consent flow contract created: ${contractUri}`);
    } catch (error) {
        if (error.message?.includes('already exists')) {
            updateStatus('ℹ️ Contract may already exist, continuing...');
            const contracts = await partnerWallet.invoke.getConsentFlowContracts({});
            if (contracts.records.length > 0) {
                contractUri = contracts.records[0].uri;
                updateStatus(`ℹ️ Using existing contract: ${contractUri}`);
            }
        } else {
            throw error;
        }
    }

    await sleep(1000);

    updateStatus('🏆 Creating test boosts/credentials...');

    const testBoosts = [
        {
            name: 'Introduction to Programming',
            category: 'Course',
            type: 'Certificate',
            description: 'Completed introductory programming course',
        },
        {
            name: 'Advanced TypeScript',
            category: 'Achievement',
            type: 'Badge',
            description: 'Mastered advanced TypeScript concepts',
        },
        {
            name: 'Open Source Contributor',
            category: 'Achievement',
            type: 'Badge',
            description: 'Contributed to open source projects',
        },
    ];

    const testUnsignedBoost = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: testDid,
        credentialSubject: {
            id: testDid,
        },
    };

    for (const boostDef of testBoosts) {
        try {
            const boostUri = await testWallet.invoke.createBoost({
                credential: testUnsignedBoost,
                category: boostDef.category,
                type: boostDef.type,
                name: boostDef.name,
                description: boostDef.description,
            });
            updateStatus(`✅ Created boost: ${boostDef.name}`);

            await sleep(500);

            await testWallet.invoke.sendBoost({
                boostUri,
                profileId: 'test-demo-user',
            });
            updateStatus(`✅ Sent boost to self: ${boostDef.name}`);

            await sleep(500);
        } catch (error) {
            updateStatus(`⚠️ Error with boost ${boostDef.name}: ${error.message}`);
        }
    }

    await sleep(1000);

    updateStatus('📝 Consenting to contract...');

    try {
        const terms = {
            read: {
                personal: { name: 'Test Demo User' },
                credentials: {
                    shareAll: true,
                    sharing: true,
                    categories: {
                        Achievement: {
                            shareAll: true,
                            sharing: true,
                            shared: [],
                        },
                        Course: {
                            shareAll: true,
                            sharing: true,
                            shared: [],
                        },
                        ID: {
                            shareAll: true,
                            sharing: true,
                            shared: [],
                        },
                    },
                },
            },
            write: {
                personal: {},
                credentials: {
                    categories: {},
                },
            },
        };

        await testWallet.invoke.consentToContract({
            contractUri,
            terms,
        });
        updateStatus('✅ Consented to contract');
    } catch (error) {
        if (error.message?.includes('already consented')) {
            updateStatus('ℹ️ Already consented to contract');
        } else {
            throw error;
        }
    }

    updateStatus('🔍 Verifying consented data...');

    try {
        const consentedData = await partnerWallet.invoke.getConsentedDataForDid(testDid, {
            limit: 50,
        });

        updateStatus(`✅ Found ${consentedData.records.length} consented credentials`);

        if (consentedData.records.length > 0) {
            updateStatus('📊 Consented credentials:');
            for (const record of consentedData.records.slice(0, 5)) {
                const credName =
                    record.credential?.name ||
                    record.credential?.credentialSubject?.achievement?.name ||
                    'Unknown';
                updateStatus(`   - ${credName}`);
            }
        }
    } catch (error) {
        updateStatus(`⚠️ Error fetching consented data: ${error.message}`);
    }

    updateStatus('');
    updateStatus('🎉 Test data generation complete!');
    updateStatus('');
    updateStatus('You can now test the LearnCardConnect component.');
    updateStatus('Sign in with:');
    updateStatus(`  Email: ${TEST_ACCOUNT_EMAIL}`);
    updateStatus('  Password: demo123 (or use your local test password)');
}
