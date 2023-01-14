import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCDisplayCard2, { VCDisplayCard2Props } from './VCDisplayCard2';
import { VerificationStatusEnum } from '@learncard/types';

export default {
    title: 'VCDisplayCard2',
    component: VCDisplayCard2,
    argTypes: {},
} as Meta<typeof VCDisplayCard2>;

const Template: Story<VCDisplayCard2Props> = args => <VCDisplayCard2 {...args} />;

const cardImgOverride = (
    <img
        className="h-full w-full object-cover"
        src={
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Lunar_eclipse_of_2022_November_8_-_cropped.jpg/440px-Lunar_eclipse_of_2022_November_8_-_cropped.jpg'
        }
        alt="Credential Achievement Image"
    />
);

const DetailsOverrideTest = (
    <>
        <div className="width-full">
            <h6 className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased">
                Description
            </h6>
            <p className="line-clamp-3 subpixel-antialiased text-grayscale-600 text-[14px] lc-line-clamp">
                override test description
            </p>
        </div>

        <div className="width-full mt-[10px]">
            <h6 className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider  subpixel-antialiased">
                Criteria
            </h6>
            <p className="line-clamp-3 subpixel-antialiased text-grayscale-600 text-[14px] lc-line-clamp">
                override critera text
            </p>
        </div>

        <div className="width-full mt-[10px] line-clamp-1 overflow-hidden vc-issuer-name-info">
            <h6 className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased">
                Issuer
            </h6>
            <p className="max-w-[344px] line-clamp-1 subpixel-antialiased text-grayscale-600 text-[14px] block overflow-ellipsis break-all">
                override details issuer override details issuer override details issuer override
                details issuer override details issuer override details issuer
            </p>
        </div>

        <div className="width-full mt-[10px] line-clamp-1 overflow-hidden vc-issuer-name-info">
            <h6 className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased">
                other field
            </h6>
            <p className="max-w-[344px] line-clamp-1 subpixel-antialiased text-grayscale-600 text-[14px] block overflow-ellipsis break-all">
                override details
            </p>
        </div>
    </>
);

const customHeaderTest = () => (
    <div
        onClick={() => console.log('test')}
        className="rounded-[40px] bg-emerald-700 max-w-[200px] p-[5px] m-auto"
    >
        CUSTOM CONTENT
    </div>
);

export const VCDisplayCardTest = Template.bind({});

// See https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/
// For example data structure for plugfest

VCDisplayCardTest.args = {
    // customHeaderComponent: customHeaderTest(),
    // overrideCardImageComponent: cardImgOverride,
    // overrideDetailsComponent: DetailsOverrideTest,
    // overrideCardTitle: 'Override Card Title test',
    // subjectImageComponent: (
    //     <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-emerald-700 text-white font-medium text-3xl">
    //         LC
    //     </div>
    // ),
    // issuerImageComponent: (
    //     <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-emerald-700 text-white font-medium text-3xl">
    //         DC
    //     </div>
    // ),
    credential: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: {
            type: 'Profile',
            id: 'did:example:issuer123',
            name: 'Jobs for the Future (JFF)',
            url: 'https://www.jff.org/',
            image: 'https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
        },
        issuanceDate: '2022-07-27T19:57:31.512Z',
        credentialSubject: {
            type: 'AchievementSubject',
            id: 'did:example:subject123',
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
            },
        },
    },
    issueeOverride: {
        name: 'Test Person',
        image: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/A2tGEP67TWeC59SmR4vP',
    },
    // issuerOverride: {
    //     name: 'Dilbert Charles',
    //     image: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/pQgXEF77R0GJKdQBdClb',
    // },

    // loading: false,
    // className: 'bg-indigo-700',

    // TODO test with Failed and Error ones too
    verification: [
        {
            check: 'proof',
            status: VerificationStatusEnum.Success,
            message: 'Issued to Example Person',
        },
        {
            check: 'proof',
            status: VerificationStatusEnum.Error,
            message: 'Issued by Some Random Did',
        },
        {
            check: 'proof',
            status: VerificationStatusEnum.Failed,
            message: 'Invalid • Expired on 17 Nov 2022',
        },
        {
            check: 'proof',
            status: VerificationStatusEnum.Success,
            message: 'Status: Active',
        },
        // {
        //     check: 'proof',
        //     status: VerificationStatusEnum.Success,
        //     message: 'Valid • Does Not Expire',
        // },
    ],
};
