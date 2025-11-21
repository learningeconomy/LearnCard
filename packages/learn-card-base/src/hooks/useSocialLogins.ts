import useWeb3Auth from './useWeb3Auth';

// import OktaIcon from 'learn-card-base/assets/images/okta-circle-icon.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-circle-icon.svg';
import DiscordIcon from 'learn-card-base/assets/images/discord-circle-icon.svg';
import MetaMaskIcon from 'learn-card-base/assets/images/metamask-circle-icon.svg';
import GithubIcon from 'learn-card-base/assets/images/github-circle-icon.svg';
import TwitterIcon from 'learn-card-base/assets/images/twitter-circle-icon.svg';
import RedditIcon from 'learn-card-base/assets/images/reddit-circle-icon.svg';
import AppleIcon from 'learn-card-base/assets/images/apple-circle-icon.svg';
import TwitchIcon from 'learn-card-base/assets/images/twitch-circle-icon.svg';
import FacebookIcon from 'learn-card-base/assets/images/facebook-circle-icon.svg';
import WhatsappIcon from 'learn-card-base/assets/images/whatsapp-circle-icon.svg';
import LinkedinIcon from 'learn-card-base/assets/images/linkedin-circle-icon.svg';
import LearnCardIcon from 'learn-card-base/assets/images/learncard-circle-icon.svg';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

export enum SocialLoginTypes {
    apple = 'apple',
    google = 'google',
    discord = 'discord',
    okta = 'okta',
    sms = 'sms',
    passwordless = 'passwordless',
    scoutsSSO = 'scoutsSSO',
}

export const useSocialLogins = (branding: BrandingEnum = BrandingEnum.learncard) => {
    const { learncardGoogleLogin } = useWeb3Auth();

    // if (branding === BrandingEnum.metaversity) {
    //     return [
    //         {
    //             id: 1,
    //             src: GoogleIcon,
    //             alt: 'google icon',
    //             onClick: learncardGoogleLogin,
    //         },
    //     ];
    // }

    return [
        // {
        //     id: 1,
        //     src: LearnCardIcon,
        //     alt: 'okta icon',
        //     onClick: oktaLogin,
        // },
        // {
        //     id: 1,
        //     src: DiscordIcon,
        //     alt: 'discord icon',
        //     onClick: discordLogin,
        // },
        // {
        //     id: 4,
        //     src: MetaMaskIcon,
        //     alt: 'metamask icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 5,
        //     src: GithubIcon,
        //     alt: 'github icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 6,
        //     src: TwitterIcon,
        //     alt: 'twitter icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 7,
        //     src: RedditIcon,
        //     alt: 'reddit icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 8,
        //     src: AppleIcon,
        //     alt: 'apple icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 9,
        //     src: TwitchIcon,
        //     alt: 'twitch icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 10,
        //     src: FacebookIcon,
        //     alt: 'facebook icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 11,
        //     src: WhatsappIcon,
        //     alt: 'whatsapp icon',
        //     onClick: () => {},
        // },
        // {
        //     id: 12,
        //     src: LinkedinIcon,
        //     alt: 'linkedin icon',
        //     onClick: () => {},
        // },
    ];
};

export default useSocialLogins;
