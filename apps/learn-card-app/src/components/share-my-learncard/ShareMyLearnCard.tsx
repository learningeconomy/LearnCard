import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { ProfilePicture, useModal } from 'learn-card-base';
import ShareTarget from './ShareTarget';

const DEFAULT_SHARE_TARGETS: {
    text: string;
    contractUri: string;
    icon: string;
    comingSoon?: boolean;
}[] = [
        {
            text: 'Share with Guardian',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-blue-umbrella.svg',
            comingSoon: true,
        },
        {
            text: 'Share with Teachers',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-red-apple.svg',
            comingSoon: true,
        },
        {
            text: 'Share with Schools',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-green-hat.svg',
            comingSoon: true,
        },
        {
            text: 'Share with Employers',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-purple-building.svg',
            comingSoon: true,
        },
        {
            text: 'Share with Mentors',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-lightblue-owl.svg',
            comingSoon: true,
        },
        {
            text: 'Share with Tutors',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-orange-book.svg',
            comingSoon: true,
        },
        {
            text: 'Share with Scholarships',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-teal-pig.svg',
            comingSoon: true,
        },
        {
            text: 'Share with My Friends',
            contractUri:
                'lc:network:network.learncard.com/trpc:contract:2e5a6eba-ffa8-4406-bae8-954c4da1a00a',
            icon: '/assets/icon/circle-purple-butterflies.svg',
            comingSoon: true,
        },
    ];

type ShareMyLearnCardProps = {};

const ShareMyLearnCard: React.FC<ShareMyLearnCardProps> = () => {
    const flags = useFlags();
    const { closeModal } = useModal();

    const shareTargets: typeof DEFAULT_SHARE_TARGETS = flags.shareTargets || DEFAULT_SHARE_TARGETS;

    return (
        <section className="max-h-full overflow-y-auto disable-scrollbars safe-area-top-margin">
            <section className="w-full flex flex-col items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] max-w-[350px] basis-full">
                <header className="flex items-center flex-col gap-[10px] border-solid border-b-[1px] border-grayscale-200 pb-[20px] w-full">
                    <span className="text-grayscale-900 font-poppins text-xl font-medium leading-[130%]">
                        Share
                    </span>

                    <div className="flex items-center justify-center">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center w-[90px] h-[90px] rounded-full overflow-hidden text-white font-medium text-4xl aspect-square"
                            customImageClass="flex justify-center items-center w-[90px] h-[90px] rounded-full overflow-hidden object-cover"
                            customSize={120}
                        />
                    </div>

                    <span className="text-grayscale-900 text-[14px] uppercase font-[700] tracking-[7px] text-center">
                        LearnCard
                    </span>

                    <span className="text-grayscale-800 text-[14px] text-center">
                        Your <b>LearnCard</b> is a digital portfolio, storing your skills,
                        experiences, achievements and transcripts.
                    </span>
                </header>

                <ul className="flex flex-col p-0 w-full">
                    {shareTargets.map(target => (
                        <ShareTarget
                            text={target.text}
                            icon={target.icon}
                            contractUri={target.contractUri}
                            onClick={closeModal}
                            comingSoon={target.comingSoon}
                        />
                    ))}
                </ul>
            </section>
        </section>
    );
};

export default ShareMyLearnCard;
