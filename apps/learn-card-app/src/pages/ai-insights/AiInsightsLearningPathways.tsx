import React, { useEffect } from 'react';

import LockSimple from 'learn-card-base/svgs/LockSimple';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import { useAiInsightCredential, useWallet } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { useHistory } from 'react-router-dom';

import 'swiper/css';
import { IonSkeletonText } from '@ionic/react';

type PathwayStep = {
    title?: string;
    description?: string;
    skills?: Array<{ title: string; description?: string }>;
};

type PathwayItem = PathwayStep & {
    pathwayUri?: string; // pathway boost uri
    topicUri?: string; // topic boost uri
};

export const AiSessionLearningPathways: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    const { data: aiInsightCredential, isLoading: aiInsightCredentialLoading } =
        useAiInsightCredential();
    const { resolveCredential, initWallet } = useWallet();
    const history = useHistory();

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
                                        (r: any) => r?.category === 'ai-topic'
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
            } catch (e) {
                console.warn('Error fetching suggested pathways', e);
                if (!isCancelled) setLearningPathwaysData([]);
            }
        };

        fetchPathways();

        return () => {
            isCancelled = true;
        };
    }, [aiInsightCredential?.insights?.suggestedPathways]);

    const handleStart = (item: PathwayItem) => {
        if (!item?.topicUri || !item?.pathwayUri) return;

        history.push(
            `/chats?topicUri=${encodeURIComponent(item.topicUri)}&pathwayUri=${encodeURIComponent(
                item.pathwayUri
            )}`
        );
    };

    if (isLoading || aiInsightCredentialLoading) {
        return (
            <div className="flex flex-col items-start justify-between w-full ion-padding border-solid border-[1px] border-grayscale-100 bg-white shadow-bottom-2-4 p-[15px] rounded-[15px]">
                <>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-full mb-6">
                            <div className="flex items-center justify-between w-full">
                                <IonSkeletonText
                                    animated
                                    style={{ width: '70%', height: '20px', borderRadius: '4px' }}
                                />

                                <IonSkeletonText
                                    animated
                                    style={{ width: '24px', height: '20px', borderRadius: '4px' }}
                                />
                            </div>

                            <div className="w-full mt-4 space-y-2">
                                <IonSkeletonText
                                    animated
                                    style={{ width: '100%', height: '14px' }}
                                />
                                <IonSkeletonText
                                    animated
                                    style={{ width: '90%', height: '14px' }}
                                />
                                <IonSkeletonText
                                    animated
                                    style={{ width: '80%', height: '14px' }}
                                />
                            </div>

                            <div className="w-full overflow-x-auto whitespace-nowrap mt-4 flex space-x-2">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="rounded-full"
                                        style={{
                                            minWidth: '80px',
                                            height: '24px',
                                            borderRadius: '9999px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <IonSkeletonText
                                            animated
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            </div>
        );
    }

    if ((learningPathwaysData?.length ?? 0) === 0 && !isLoading && !aiInsightCredentialLoading)
        return null;

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
            <div className="w-full flex items-center justify-start">
                <AiPathwaysIconWithShape className="w-[40px] h-[40px]" />
                <h2 className="text-xl text-grayscale-800 font-notoSans">Learning Pathways</h2>
            </div>
            {learningPathwaysData?.map(
                ({ title, description, skills, topicUri, pathwayUri }, index) => {
                    return (
                        <div
                            role="button"
                            key={`${pathwayUri || title}-${index}`}
                            className="flex flex-col items-start justify-between bg-white h-full w-full ion-padding border-solid border-[1px] border-grayscale-100 rounded-[20px] cursor-pointer mb-4 mt-4"
                            onClick={() =>
                                handleStart({ title, description, skills, topicUri, pathwayUri })
                            }
                        >
                            <div>
                                <div className="flex items-center justify-between w-full">
                                    <h4 className="pr-1 text-grayscale-800 font-semibold text-[17px] text-left line-clamp-1">
                                        {title}
                                    </h4>

                                    <div>
                                        <SlimCaretRight className="text-grayscale-800 w-[24px] h-auto" />
                                    </div>
                                </div>
                                <p className="text-grayscale-900 line-clamp-3 text-sm my-4 text-left">
                                    {description}
                                </p>
                            </div>
                            <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
                                {skills?.map(({ title }, idx) => (
                                    <span
                                        key={`${title}-${idx}`}
                                        className="font-semibold bg-indigo-100 text-indigo-500 rounded-full text-xs px-2 py-1 min-h-[24px] mr-2 inline-block align-top"
                                    >
                                        <LockSimple
                                            version="2"
                                            className="h-[16px] w-[16px] inline mr-1"
                                        />

                                        {title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                }
            )}
        </div>
    );
};

export default AiSessionLearningPathways;
