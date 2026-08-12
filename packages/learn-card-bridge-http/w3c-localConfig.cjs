const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3100';

module.exports = {
    settings: {
        enableInteropTests: false,
        testAllImplementations: false,
    },
    implementations: [
        {
            name: 'Learning Economy Foundation',
            implementation: 'LearnCard DIDKit',
            issuers: [
                {
                    id: 'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH',
                    endpoint: `${baseUrl}/credentials/issue`,
                    options: {
                        type: 'DataIntegrityProof',
                        cryptosuite: 'eddsa-rdfc-2022',
                    },
                    supports: {
                        vc: ['1.1', '2.0'],
                    },
                    tags: ['eddsa-rdfc-2022', 'localhost'],
                },
            ],
            verifiers: [
                {
                    id: 'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH',
                    endpoint: `${baseUrl}/credentials/verify`,
                    tags: ['eddsa-rdfc-2022', 'localhost'],
                },
            ],
        },
    ],
};
