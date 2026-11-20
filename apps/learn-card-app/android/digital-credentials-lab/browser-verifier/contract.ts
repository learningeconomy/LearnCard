import type { verifyDcApiResponse } from '@openeudi/openid4vp';

/** Public synthetic fixture contract only. No LearnCard verifier or issuer code is imported. */
export const ISSUER = 'did:key:z6MkvDqGT54cXesYGvABpF1UapVNwjCqRcafi4Px6Thv5T3Z';
export const ISSUER_JWK = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: '6kpsY-KcUgq-9VB7Ey7F-ZVHdq6-vnuSQh7qaRRG0iw',
    kid: `${ISSUER}#${ISSUER.slice('did:key:'.length)}`,
};
export const QUERY: Parameters<typeof verifyDcApiResponse>[1] = {
    credentials: [
        {
            id: 'course_completion',
            format: 'dc+sd-jwt',
            meta: { vct_values: ['https://credentials.learncard.com/vct/course-completion'] },
            claims: [{ path: ['course_name'] }, { path: ['completion_date'] }],
        },
    ],
};
