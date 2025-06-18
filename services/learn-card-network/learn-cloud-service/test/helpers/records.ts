import type { EncryptedCredentialRecord } from '@learncard/types';

export const testRecordA: EncryptedCredentialRecord = {
    encryptedRecord: {
        protected: 'eyJlbmMiOiJYQzIwUCJ9',
        iv: '3JlblE9GLYhEEdh6jSnjNcwOKRaL6yiB',
        ciphertext: 'wWAlDF3fPTqk-le5aSEifgDl_us57SlSmjZfc5AOkPiLCSrJmYS1XJ13fIufAHNb',
        tag: 'DwIHkOWxQAPeJW3UJB43BQ',
        recipients: [
            {
                encrypted_key: 'kpYszRefPu7goHFDdu8u5oZfZCEgvmAidn-iPaWwi3E',
                header: {
                    alg: 'ECDH-ES+XC20PKW',
                    iv: 'OpUw5jw0ufgxBzO2qSb6em2UT6TA1dWR',
                    tag: 'zVaGpjQgr2_zTIBTkxfLyA',
                    epk: {
                        kty: 'OKP',
                        crv: 'X25519',
                        x: 'iWSPelaue3ZHTa8BZpJWVLSOZP00gfM2169Kmnc-fnA',
                    },
                    kid: 'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH#z6LShQWPmAFH6zLhbHykYq2Q7J7WtnPkbwRTermxUNWWWYog',
                },
            },
        ],
    },
    fields: ['recordA', 'record'],
    id: 'testRecordA',
    title: 'Record A',
};

export const testRecordB: EncryptedCredentialRecord = {
    encryptedRecord: {
        protected: 'eyJlbmMiOiJYQzIwUCJ9',
        iv: '3JlblE9GLYhEEdh6jSnjNcwOKRaL6yiB',
        ciphertext: 'wWAlDF3fPTqk-le5aSEifgDl_us57SlSmjZfc5AOkPiLCSrJmYS1XJ13fIufAHNb',
        tag: 'DwIHkOWxQAPeJW3UJB43BQ',
        recipients: [
            {
                encrypted_key: 'kpYszRefPu7goHFDdu8u5oZfZCEgvmAidn-iPaWwi3E',
                header: {
                    alg: 'ECDH-ES+XC20PKW',
                    iv: 'OpUw5jw0ufgxBzO2qSb6em2UT6TA1dWR',
                    tag: 'zVaGpjQgr2_zTIBTkxfLyA',
                    epk: {
                        kty: 'OKP',
                        crv: 'X25519',
                        x: 'iWSPelaue3ZHTa8BZpJWVLSOZP00gfM2169Kmnc-fnA',
                    },
                    kid: 'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH#z6LShQWPmAFH6zLhbHykYq2Q7J7WtnPkbwRTermxUNWWWYog',
                },
            },
        ],
    },
    fields: ['recordB', 'record'],
    id: 'testRecordB',
    title: 'Record B',
};

export const testRecordC: Omit<EncryptedCredentialRecord, 'id'> = {
    encryptedRecord: {
        protected: 'eyJlbmMiOiJYQzIwUCJ9',
        iv: '3JlblE9GLYhEEdh6jSnjNcwOKRaL6yiB',
        ciphertext: 'wWAlDF3fPTqk-le5aSEifgDl_us57SlSmjZfc5AOkPiLCSrJmYS1XJ13fIufAHNb',
        tag: 'DwIHkOWxQAPeJW3UJB43BQ',
        recipients: [
            {
                encrypted_key: 'kpYszRefPu7goHFDdu8u5oZfZCEgvmAidn-iPaWwi3E',
                header: {
                    alg: 'ECDH-ES+XC20PKW',
                    iv: 'OpUw5jw0ufgxBzO2qSb6em2UT6TA1dWR',
                    tag: 'zVaGpjQgr2_zTIBTkxfLyA',
                    epk: {
                        kty: 'OKP',
                        crv: 'X25519',
                        x: 'iWSPelaue3ZHTa8BZpJWVLSOZP00gfM2169Kmnc-fnA',
                    },
                    kid: 'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH#z6LShQWPmAFH6zLhbHykYq2Q7J7WtnPkbwRTermxUNWWWYog',
                },
            },
        ],
    },
    fields: ['recordC', 'notARecord'],
    title: 'Record C',
};
