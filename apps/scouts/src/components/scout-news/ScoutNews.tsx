//query for getting scouts data from their api
import * as m from '../../paraglide/messages.js';
import React from 'react';
import { Capacitor } from '@capacitor/core';
import { useQuery } from '@tanstack/react-query';
import { formatLocaleDate } from '../../i18n/formatters';
import ExternalLink from 'learn-card-base/svgs/ExternalLink';
import { openExternalLink } from '../../helpers/externalLinkHelpers';

import { LoadingSpinner } from 'learn-card-base/components/loaders/LoadingSpinner';
import ScoutNewsDefaultData from './scoutnewsdefault.json';
import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';
import { getScoutNewsEndpoint, scoutNewsQueryOptions, type ScoutNewsItem } from './scoutNewsApi';

const BASE_URL = 'https://scout.org';

const formatDate = (dateString: string) => {
    const match = dateString.match(/datetime="([^"]+)"/);

    if (match && match[1]) {
        return formatLocaleDate(match[1], {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
        });
    } else {
        return formatLocaleDate(dateString, {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
        });
    }
};

type ScoutNewsListItemProps = {
    data: ScoutNewsItem;
};

export const useFetchScoutNews = () => {
    // Native origins are capacitor://localhost / https://localhost. Always use
    // the resolved tenant's HTTPS domain, including staging.pass.scout.org.
    const endpoint = getScoutNewsEndpoint(
        Capacitor.isNativePlatform(),
        getResolvedTenantConfig().domain
    );
    return useQuery(scoutNewsQueryOptions(endpoint));
};

export const ScoutsNewsList: React.FC = () => {
    const { data, isLoading, error } = useFetchScoutNews();

    const scoutsNewsData = !error && data ? data?.data : ScoutNewsDefaultData.data;

    const renderScoutsNewsList = scoutsNewsData?.map(node => {
        return <ScoutNewsListItem key={node.node_id} data={node} />;
    });
    const bgClassName = isLoading && !data ? 'bg-white' : 'bg-[#EFF0F5]';
    const sectionClassName = `${bgClassName} w-full flex items-center justify-start  bg-repeat p-[10px] flex justify-center h-full pb-[50px]`;

    return (
        <section className={sectionClassName}>
            {data && <div className="max-w-[600px]">{renderScoutsNewsList}</div>}

            {!data && isLoading && (
                <section className="loading-spinner-container flex items-center mt-[20px] justify-center w-full ">
                    <div className="max-w-[180px]">
                        <LoadingSpinner />
                    </div>
                </section>
            )}
        </section>
    );
};

const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

type ScoutNewsTagItemProps = {
    tag: string;
};

export const ScoutNewsTagItem: React.FC<ScoutNewsTagItemProps> = ({ tag }) => {
    const isTooLong = tag?.length > 25;
    const truncateTag = isTooLong ? tag?.slice(0, 25) : tag;
    const _tag = isTooLong ? `${truncateTag}...` : tag;
    return (
        <div className="rounded-full w-full flex items-center bg-grayscale-100 px-[15px] py-[5px]">
            {_tag}
        </div>
    );
};

export const ScoutNewsListItem: React.FC<ScoutNewsListItemProps> = ({ data }) => {
    if (!data) return <></>;

    const { author, preview_image, publish_date, title, path, tags } = data;

    const titleText = decodeHtml(title);

    const splitTags = tags?.split(',')?.slice(0, 1);

    const formattedDate = formatDate(publish_date);

    const handleNewsLink = () => {
        const newsLink = `${BASE_URL}${path}`;
        openExternalLink(newsLink);
    };

    const renderSplitTags = splitTags?.map((tag, index) => {
        return <ScoutNewsTagItem tag={tag} key={index} />;
    });

    return (
        <div className="bg-white my-[10px] rounded-[20px] p-[20px] h-[150px] relative flex shadow-bottom w-full ">
            <div className="news-content-display max-w-[490px] w-full flex flex-col justify-between">
                <div className="date flex items-center justify-between w-full text-xs font-semibold uppercase subpixel-antialiased">
                    {formattedDate}
                    <button className="cursor-pointer" onClick={handleNewsLink}>
                        <ExternalLink color="#622599" />
                    </button>
                </div>
                <h6
                    data-testid="scout-news-item-title"
                    className="text-[]text- line-clamp-2 pr-[15px] subpixel-antialiased"
                >
                    {titleText}
                </h6>
                <div className="bottom-news-line flex justify-between flex-wrap pt-[8px]">
                    <div className="text-xs font-semibold flex items-center ">
                        {renderSplitTags}
                    </div>
                    <button
                        onClick={handleNewsLink}
                        className="text-xs font-semibold uppercase subpixel-antialiased text-right"
                    >
                        {m['scoutNews.viewPost']()}
                    </button>
                </div>
            </div>

            <div className="news-link width-[110px] h-full flex-shrink-0">
                <div className="link-icon-display flex flex-col h-full justify-between items-end"></div>
            </div>
        </div>
    );
};
