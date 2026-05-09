import React from 'react';
import { Meta, Story } from '@storybook/react';

import VCDisplayCard2 from './VCDisplayCard2';
import { LCCategoryEnum } from '../../types';
import { TestVerificationItems } from '../../helpers/test.helpers';

const BASE_VERIFICATION_ITEMS = [
    TestVerificationItems.SUCCESS.PROOF,
    TestVerificationItems.SUCCESS.NO_EXPIRATION,
];

const buildCredential = ({
    id,
    issuer,
    subjectId,
    title,
    description,
    displayType,
    achievementImage,
}: {
    id: string;
    issuer: any;
    subjectId?: string;
    title: string;
    description: string;
    displayType?: string;
    achievementImage?: string;
}) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer,
    issuanceDate: '2026-04-28T20:05:57.307102174Z',
    credentialSubject: {
        ...(subjectId ? { id: subjectId } : {}),
        type: ['AchievementSubject'],
        achievement: {
            type: 'Achievement',
            name: title,
            description,
            image: achievementImage,
            criteria: {
                type: 'Criteria',
                narrative: `${title} criteria`,
            },
        },
    },
    ...(displayType ? { display: { displayType } } : {}),
});

const trustedIssuer = {
    type: 'Profile',
    id: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
    name: 'North Star Academy',
    image: 'https://picsum.photos/200?1',
};

const trustedSubject = {
    type: 'Profile',
    id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
    name: 'Avery Chen',
    image: 'https://picsum.photos/200?2',
};

const profileChip = (label: string) => (
    <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-700 text-white font-semibold text-2xl">
        {label}
    </div>
);

type VCDisplayCase = {
    title: string;
    description: string;
    props: React.ComponentProps<typeof VCDisplayCard2>;
};

const cases: VCDisplayCase[] = [
    {
        title: 'Trusted profiles with custom image components',
        description: 'Shows the override path when both issuer and subject provide custom avatars.',
        props: {
            credential: buildCredential({
                id: 'urn:uuid:trusted-profiles',
                issuer: trustedIssuer,
                subjectId: trustedSubject.id,
                title: 'Supported Learning Credential',
                description: 'A clean baseline with trusted names and custom avatar overrides.',
                displayType: 'certificate',
                achievementImage: 'https://picsum.photos/600/400?1',
            }) as any,
            issuerOverride: trustedIssuer as any,
            issueeOverride: trustedSubject as any,
            issuerImageComponent: profileChip('NS'),
            subjectImageComponent: profileChip('AC'),
            categoryType: LCCategoryEnum.achievement,
            knownDIDRegistry: { source: 'trusted', results: {} },
            isFrontOverride: true,
            verificationItems: BASE_VERIFICATION_ITEMS,
        },
    },
    {
        title: 'did:web issuer with no name or image',
        description:
            'Uses the readable DID fallback and the icon avatar when profile data is sparse.',
        props: {
            credential: buildCredential({
                id: 'urn:uuid:did-web-issuer',
                issuer: 'did:web:network.learncard.com:users:donny',
                subjectId: 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                title: 'Web Issuer Credential',
                description: 'Issuer data is a DID only, with no display name or image.',
                displayType: 'certificate',
                achievementImage: 'https://picsum.photos/600/400?2',
            }) as any,
            categoryType: LCCategoryEnum.achievement,
            knownDIDRegistry: { source: 'unknown', results: {} },
            isFrontOverride: true,
            verificationItems: BASE_VERIFICATION_ITEMS,
        },
    },
    {
        title: 'Generic VC path with did:web issuer',
        description:
            'Covers the default VCDisplayCard2 front face without certificate or award routing.',
        props: {
            credential: buildCredential({
                id: 'urn:uuid:generic-vc-path',
                issuer: 'did:web:network.learncard.com:users:community',
                subjectId: 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                title: 'Community Credential',
                description: 'A plain VC layout with DID-only issuer data.',
                achievementImage: 'https://picsum.photos/600/400?6',
            }) as any,
            categoryType: LCCategoryEnum.achievement,
            knownDIDRegistry: { source: 'unknown', results: {} },
            isFrontOverride: true,
            verificationItems: BASE_VERIFICATION_ITEMS,
        },
    },
    {
        title: 'Blank issuer profile and missing recipient name',
        description: 'Exercises the friendly Unknown issuer / Unknown recipient labels.',
        props: {
            credential: buildCredential({
                id: 'urn:uuid:blank-profile',
                issuer: {},
                title: 'Sparse Credential',
                description: 'Both sides are missing human-friendly labels.',
                displayType: 'certificate',
                achievementImage: 'https://picsum.photos/600/400?3',
            }) as any,
            issuerOverride: {} as any,
            issueeOverride: {} as any,
            categoryType: LCCategoryEnum.achievement,
            knownDIDRegistry: { source: 'untrusted', results: {} },
            isFrontOverride: true,
            verificationItems: BASE_VERIFICATION_ITEMS,
        },
    },
    {
        title: 'Ticket example did:jwk issuer and did:key subject',
        description:
            'Matches the provided shape with a JWK issuer and no human-readable issuer name.',
        props: {
            credential: buildCredential({
                id: 'urn:uuid:875bdcbc-7443-4438-b50d-d1f6bd84b063',
                issuer: {
                    id: 'did:jwk:eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6IksxQnd1WFJMM1ZKUEVZM3ZUQWN1aXMzaGItM0VBQmMzNlFhUk9nNWFYVVEifQ',
                },
                subjectId: 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                title: 'Bachelor of Science and Arts',
                description: 'A credential with an issuer DID only and a key-based recipient DID.',
                displayType: 'certificate',
                achievementImage: 'https://picsum.photos/600/400?4',
            }) as any,
            categoryType: LCCategoryEnum.achievement,
            knownDIDRegistry: { source: 'unknown', results: {} },
            isFrontOverride: true,
            verificationItems: BASE_VERIFICATION_ITEMS,
        },
    },
    {
        title: 'Self-issued did:web credential',
        description:
            'Confirms the self-issued path still reads well when the issuer and subject match.',
        props: {
            credential: buildCredential({
                id: 'urn:uuid:self-issued',
                issuer: 'did:web:network.learncard.com:users:donny',
                subjectId: 'did:web:network.learncard.com:users:donny',
                title: 'Self Issued Credential',
                description: 'The issuer and subject are the same DID.',
                displayType: 'award',
                achievementImage: 'https://picsum.photos/600/400?5',
            }) as any,
            categoryType: LCCategoryEnum.meritBadge,
            knownDIDRegistry: { source: 'unknown', results: {} },
            isFrontOverride: true,
            verificationItems: BASE_VERIFICATION_ITEMS,
        },
    },
];

const AvatarFallbackMatrix: React.FC = () => {
    return (
        <div className="bg-grayscale-100 min-h-screen p-8">
            <div className="mx-auto max-w-[1200px] space-y-8">
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold text-grayscale-900 font-poppins">
                        Credential avatar fallback matrix
                    </h1>
                    <p className="text-sm text-grayscale-600 leading-relaxed font-poppins max-w-[720px]">
                        Use this story to verify issuer and subject visuals stay polished when
                        names, images, or DID shapes are missing or unusual.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
                    {cases.map(testCase => (
                        <section
                            key={testCase.title}
                            className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(24,34,78,0.12)] space-y-4"
                        >
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-grayscale-900 font-poppins">
                                    {testCase.title}
                                </h2>
                                <p className="text-sm text-grayscale-600 leading-relaxed font-poppins">
                                    {testCase.description}
                                </p>
                            </div>

                            <div className="flex justify-center overflow-x-auto pb-2">
                                <VCDisplayCard2 {...testCase.props} />
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default {
    title: 'VCDisplayCard2/Avatar Fallback Matrix',
    component: VCDisplayCard2,
    argTypes: {},
} as Meta<typeof VCDisplayCard2>;

const Template: Story = () => <AvatarFallbackMatrix />;

export const AvatarFallbackMatrixStory = Template.bind({});
AvatarFallbackMatrixStory.args = {};
