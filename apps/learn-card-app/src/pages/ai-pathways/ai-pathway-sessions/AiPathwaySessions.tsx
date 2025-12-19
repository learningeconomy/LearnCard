import React, { useEffect, useState } from 'react';

import AiPathwaySessionsItem from './AiPathwaySessionItem';
import AiPathwaySessionsSkeletonLoader from './AiPathwaySessionsSkeletonLoader';

import {
    CredentialCategoryEnum,
    categoryMetadata,
    useAiInsightCredential,
    useWallet,
} from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

import 'swiper/css';

export type PathwayStep = {
    title?: string;
    description?: string;
    skills?: Array<{ title: string; description?: string }>;
};

export type PathwayItem = PathwayStep & {
    pathwayUri?: string; // pathway boost uri
    topicUri?: string; // topic boost uri
};

export const AiPathwaySessions: React.FC = () => {
    const { data: aiInsightCredential, isLoading: aiInsightCredentialLoading } =
        useAiInsightCredential();
    const [fetchPathwaysLoading, setFetchPathwaysLoading] = useState<boolean>(false);

    const { resolveCredential, initWallet } = useWallet();

    const [learningPathwaysData, setLearningPathwaysData] = React.useState<PathwayItem[]>([]);

    useEffect(() => {
        const uris: string[] = aiInsightCredential?.insights?.suggestedPathways ?? [];
        if (!uris?.length) {
            setLearningPathwaysData([]);
            return;
        }

        let isCancelled = false;

        const fetchPathways = async () => {
            try {
                setFetchPathwaysLoading(true);
                const creds = await Promise.all(
                    uris.map(async uri => {
                        try {
                            return await resolveCredential(uri);
                        } catch (e) {
                            console.warn('Failed to resolve pathway credential:', uri, e);
                            return undefined;
                        }
                    })
                );

                const wallet = await initWallet();

                const items: PathwayItem[] = (
                    await Promise.all(
                        creds.filter(Boolean).map(async cred => {
                            const vc: any = unwrapBoostCredential(cred as any);
                            const pathwayBoostUri: string | undefined = (cred as any)?.boostId;

                            // Try to find the parent topic via familial lookup
                            let topicUri: string | undefined;
                            if (pathwayBoostUri) {
                                try {
                                    const family = await wallet.invoke.getFamilialBoosts(
                                        pathwayBoostUri,
                                        {
                                            parentGenerations: 3,
                                            childGenerations: 0,
                                            limit: 100,
                                        }
                                    );
                                    const topic = family?.records?.find(
                                        (r: any) =>
                                            r?.category ===
                                            categoryMetadata[CredentialCategoryEnum.aiTopic]
                                                .contractCredentialTypeOverride
                                    );
                                    topicUri = topic?.uri;
                                } catch (e) {
                                    console.warn('Failed to fetch familial boosts for pathway', e);
                                }
                            }

                            const lp = vc?.learningPathway;
                            const step: PathwayStep = lp?.step ?? lp ?? {};
                            const item: PathwayItem = {
                                title: step?.title,
                                description: step?.description,
                                skills: step?.skills ?? [],
                                pathwayUri: pathwayBoostUri,
                                topicUri,
                            };
                            return item;
                        })
                    )
                ).filter(item => !!(item.title || item.description));

                if (!isCancelled) setLearningPathwaysData(items);
                setFetchPathwaysLoading(false);
            } catch (e) {
                setFetchPathwaysLoading(false);
                console.warn('Error fetching suggested pathways', e);
                if (!isCancelled) setLearningPathwaysData([]);
            }
        };

        fetchPathways();

        return () => {
            isCancelled = true;
        };
    }, [aiInsightCredential?.insights?.suggestedPathways]);

    if (!fetchPathwaysLoading && (learningPathwaysData?.length ?? 0) === 0) return null;

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">
                        Explore AI Sessions
                    </h2>
                </div>
                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {fetchPathwaysLoading ? (
                        <AiPathwaySessionsSkeletonLoader />
                    ) : (
                        learningPathwaysData?.map(
                            ({ title, description, skills, topicUri, pathwayUri }, index) => (
                                <AiPathwaySessionsItem
                                    title={title}
                                    description={description}
                                    skills={skills}
                                    topicUri={topicUri}
                                    pathwayUri={pathwayUri}
                                    key={`${pathwayUri || title}-${index}`}
                                />
                            )
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiPathwaySessions;
