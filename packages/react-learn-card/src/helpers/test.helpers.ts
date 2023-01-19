// See https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/
// For example data structure for plugfest
export const JffCredential = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
        type: 'Profile',
        id: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
        name: 'Jobs for the Future (JFF)',
        url: 'https://www.jff.org/',
        image: 'https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
    },
    issuanceDate: '2022-07-27T19:57:31.512Z',
    credentialSubject: {
        type: 'AchievementSubject',
        id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
        achievement: {
            type: 'Achievement',
            name: 'Our Wallet Passed JFF Plugfest #1 2022',
            description: 'This wallet can display this Open Badge 3.0',
            criteria: {
                type: 'Criteria',
                narrative:
                    'The first cohort of the JFF Plugfest 1 in May/June of 2021 collaborated to push interoperability of VCs in education forward.',
            },
            image: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/plugfest-1-badge-image.png',
            tag: ['Skill A', 'Subskill A', 'Skill B'],
        },
    },
};
