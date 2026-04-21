import { useHistory } from 'react-router-dom';

import SlimCaretRight from '../../svgs/SlimCaretRight';

import { aiPassportApps } from '../../ai-passport-apps/aiPassport-apps.helpers';
import type { Boost, VC } from '@learncard/types';
import { getAiTopicTitle } from '../../new-ai-session/newAiSession.helpers';
import { useGetAppStoreListingBySlug, useGetProfile } from 'learn-card-base';
import {
    getAppSlugFromDidWeb,
    getProfileIdFromLCNDidWeb,
} from 'learn-card-base/helpers/credentialHelpers';
import { unwrapBoostCredential } from '@learncard/helpers';

const getIssuerId = (topicVc?: VC): string | undefined => {
    const issuer = topicVc?.issuer;

    if (!issuer) return undefined;
    return typeof issuer === 'string' ? issuer : issuer.id;
};

export const AiSessionTopicItem: React.FC<{
    topicRecord?: { contractUri?: string };
    topicBoost?: Boost;
    topicVc?: VC;
    topicSessionsCount: number;
}> = ({ topicRecord, topicBoost, topicVc, topicSessionsCount }) => {
    const history = useHistory();

    const app = aiPassportApps?.find(app => app?.contractUri === topicRecord?.contractUri);
    const issuerId = getIssuerId(unwrapBoostCredential(topicVc));
    const issuerProfileId = !app ? getProfileIdFromLCNDidWeb(issuerId) : undefined;
    const issuerAppSlug = !app ? getAppSlugFromDidWeb(issuerId) : undefined;
    const { data: issuerProfile } = useGetProfile(issuerProfileId, Boolean(issuerProfileId));
    const { data: issuerAppListing } = useGetAppStoreListingBySlug(
        issuerAppSlug,
        Boolean(issuerAppSlug)
    );

    const imageSrc =
        app?.img ||
        issuerProfile?.image ||
        issuerAppListing?.icon_url ||
        topicVc?.image ||
        undefined;
    const imageAlt =
        app?.name || issuerProfile?.displayName || issuerAppListing?.display_name || 'Topic image';
    const topicTitle = getAiTopicTitle(topicVc) ?? '';

    return (
        <button
            type="button"
            onClick={() => history.push(`/ai/sessions?topicBoostUri=${topicBoost?.uri}`)}
            className="flex items-center justify-between w-full bg-white pb-[12px] pt-[12px]"
        >
            <div className="flex items-center justify-start">
                <div className="w-[45px] flex items-center justify-center mr-1">
                    <div className="h-[45px] w-[45px]">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[12px] overflow-hidden border-[1px] border-solid"
                            alt={imageAlt}
                            src={imageSrc}
                        />
                    </div>
                </div>
                <p className="text-grayscale-900 text-[17px] font-notoSans font-semibold capitalize ml-2 text-left pr-4 line-clamp-2">
                    {topicTitle}
                </p>
            </div>

            <div className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                <span>{topicSessionsCount}</span>
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </div>
        </button>
    );
};

export default AiSessionTopicItem;
