import moment from 'moment';
import { VerificationItem, BoostRecipientInfo, LCNBoostStatusEnum, VC } from '@learncard/types';
import { BoostCMSAppearanceDisplayTypeEnum } from './boost';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { RouteComponentProps } from 'react-router-dom';
import {
    BoostCMSState,
    LCAStylesPackRegistryEntry,
    convertAttachmentsToEvidence,
    defaultCategoryThumbImages,
    defaultIDCardImage,
    getAchievementTypeFromCustomType,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
} from 'learn-card-base';
import {
    BoostCategoryOptionsEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
    boostCategoryOptions,
} from './boost-options/boostOptions';

export const addFallbackNameToCMSState = (state: BoostCMSState): BoostCMSState => {
    const fallbackName = isCustomBoostType(state.basicInfo.achievementType ?? '')
        ? replaceUnderscoresWithWhiteSpace(
              getAchievementTypeFromCustomType(state.basicInfo.achievementType ?? '') ?? ''
          )
        : CATEGORY_TO_SUBCATEGORY_LIST[state.basicInfo.type].find(
              options => options.type === state.basicInfo.achievementType
          )?.title ?? '';

    return {
        ...state,
        basicInfo: { ...state.basicInfo, name: state.basicInfo.name || fallbackName },
    };
};

export const getBoostVerificationPreview = (input: BoostCMSState): VerificationItem[] => {
    const result: VerificationItem[] = [{ status: 'Success', check: 'proof', message: 'Valid' }];

    const { expirationDate } = input.basicInfo;

    const isExpired = expirationDate && Number(new Date(expirationDate)) < Number(new Date());

    if (expirationDate) {
        const formattedDate = moment(expirationDate).format('DD MMM yyyy').toUpperCase();

        result.push({
            status: isExpired ? 'Failed' : 'Success',
            check: 'expiration',
            message: isExpired
                ? `Invalid • Expired ${formattedDate}`
                : `Valid • Expires ${formattedDate}`,
        });
    } else {
        result.push({ status: 'Success', check: 'expiration', message: 'Does Not Expire' });
    }

    return result;
};

export const getBoostCredentialPreview = (vcInput: BoostCMSState) => {
    const walletDid = '';
    const currentDate = new Date()?.toISOString();

    let fallbackCredentialValues;

    if (isCustomBoostType(vcInput?.basicInfo?.achievementType)) {
        const customBoostTypeTitle = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(vcInput?.basicInfo?.achievementType)
        );
        fallbackCredentialValues = {
            title: customBoostTypeTitle,
            type: vcInput?.basicInfo?.achievementType,
        };
    } else {
        fallbackCredentialValues =
            CATEGORY_TO_SUBCATEGORY_LIST?.[vcInput?.basicInfo?.type].find(
                options => options?.type === vcInput?.basicInfo?.achievementType
            ) ?? {};
    }

    const credentialPreview = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
            {
                id: '@id',
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                BoostCredential: {
                    '@id': 'https://www.example.org/boost-credential',
                    '@context': {
                        display: {
                            '@id': 'https://www.example.org/boost-display',
                            '@context': {
                                backgroundImage: {
                                    '@id': 'https://www.example.org/backgroundImage',
                                    '@type': 'xsd:string',
                                },
                                backgroundColor: {
                                    '@id': 'https://www.example.org/backgroundColor',
                                    '@type': 'xsd:string',
                                },
                            },
                        },
                        image: {
                            '@id': 'https://www.example.org/boost-image',
                            '@type': 'xsd:string',
                        },
                        attachments: {
                            '@id': 'https://www.example.org/boost-attachments',
                            '@container': '@set',
                            '@context': {
                                type: {
                                    '@id': 'https://www.example.org/attachmentType',
                                    '@type': 'xsd:string',
                                },
                                title: {
                                    '@id': 'https://www.example.org/attachmentTitle',
                                    '@type': 'xsd:string',
                                },
                                url: {
                                    '@id': 'https://www.example.org/attachmentUrl',
                                    '@type': 'xsd:string',
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: 'http://example.com/credentials/3527', // unique id
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        issuer: walletDid,
        issuanceDate: currentDate,
        name: vcInput?.basicInfo?.name || fallbackCredentialValues?.title, // title
        expirationDate: vcInput?.basicInfo?.expirationDate, // iso string
        credentialSubject: {
            id: walletDid,
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://example.com/achievements/21st-century-skills/teamwork',
                type: ['Achievement'],
                achievementType: vcInput.basicInfo.achievementType, // category type -> License
                criteria: {
                    narrative: vcInput?.basicInfo?.narrative, // criteria
                },
                description: vcInput?.basicInfo?.description, // description
                name: vcInput?.basicInfo?.name || fallbackCredentialValues?.title, // title
                image: vcInput?.appearance?.badgeThumbnail, // badge image
            },
        },
        display: {
            // appearance
            backgroundImage: vcInput?.appearance?.backgroundImage ?? '',
            backgroundColor: vcInput?.appearance?.backgroundColor ?? '',
            displayType: vcInput?.appearance?.displayType ?? '',
        },
        image: vcInput?.appearance?.badgeThumbnail, // badge image,
        attachments: vcInput?.mediaAttachments, // media attachments
        skills: vcInput?.skills ?? [],
    };

    return credentialPreview;
};

export const updateBoost = async (
    boostUri: string,
    vcInput: BoostCMSState,
    wallet: BespokeLearnCard,
    boostStatus: LCNBoostStatusEnum
) => {
    const walletDid = wallet?.id?.did();
    const currentDate = new Date()?.toISOString();
    const expirationDate = vcInput?.basicInfo?.expirationDate
        ? new Date(vcInput.basicInfo.expirationDate).toISOString()
        : undefined;

    let fallbackCredentialValues;

    if (isCustomBoostType(vcInput?.basicInfo?.achievementType)) {
        const customBoostTypeTitle = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(vcInput?.basicInfo?.achievementType)
        );
        fallbackCredentialValues = {
            title: customBoostTypeTitle,
            type: vcInput?.basicInfo?.achievementType,
        };
    } else {
        fallbackCredentialValues =
            CATEGORY_TO_SUBCATEGORY_LIST?.[vcInput?.basicInfo?.type].find(
                options => options?.type === vcInput?.basicInfo?.achievementType
            ) ?? {};
    }

    const evidence = convertAttachmentsToEvidence(vcInput?.mediaAttachments);
    // attachments are deprecated in favor of evidence
    // this will clear any existing attachments currently in draft on next update / publish
    const attachments = undefined;

    const credentialPayload = {
        subject: walletDid,
        issuanceDate: currentDate,
        boostName: vcInput?.basicInfo?.name || fallbackCredentialValues?.title,
        achievementType: vcInput.basicInfo.achievementType,
        achievementDescription: vcInput.basicInfo.description,
        achievementNarrative: vcInput.basicInfo.narrative,
        achievementName: vcInput?.basicInfo?.name || fallbackCredentialValues?.title,
        boostImage: vcInput.appearance.badgeThumbnail,
        achievementImage: vcInput.appearance.badgeThumbnail,
        expirationDate: expirationDate,
        display: {
            backgroundColor: vcInput.appearance.backgroundColor,
            backgroundImage: vcInput.appearance.backgroundImage,
            displayType: vcInput?.appearance?.displayType ?? '',
            previewType: vcInput?.appearance?.previewType ?? 'default',
        },
        evidence, // ! attachments are deprecated in favor of evidence
        attachments,
        skills: vcInput?.skills ?? [],
        address: vcInput?.address,
        boostID: {
            fontColor: vcInput?.appearance?.fontColor,
            accentColor: vcInput?.appearance?.accentColor,
            backgroundImage: vcInput?.appearance?.idBackgroundImage,
            dimBackgroundImage: vcInput?.appearance?.dimIdBackgroundImage,
            issuerThumbnail: vcInput?.appearance?.idIssuerThumbnail,
            showIssuerThumbnail: vcInput?.appearance?.showIdIssuerImage,
            IDIssuerName: vcInput?.basicInfo?.issuerName,
        },
    };

    if (
        vcInput?.basicInfo?.type === BoostCategoryOptionsEnum.id ||
        vcInput?.basicInfo?.type === BoostCategoryOptionsEnum.membership
    ) {
        credentialPayload.type = 'boostID';
    } else {
        delete credentialPayload?.address;
        delete credentialPayload?.boostID;
        credentialPayload.type = 'boost';
    }

    const updatedCredential = await wallet.invoke.newCredential({
        ...credentialPayload,
    });

    const updatedBoost = await wallet?.invoke?.updateBoost(boostUri, {
        name: vcInput?.basicInfo?.name || fallbackCredentialValues?.title,
        type: vcInput?.basicInfo.achievementType,
        category: vcInput?.basicInfo?.type,
        status: boostStatus,
        credential: updatedCredential,
    });

    return updatedBoost;
};

export const updateBoostStatus = async (
    wallet: BespokeLearnCard,
    boostUri: string,
    boostStatus: LCNBoostStatusEnum
) => {
    const updatedBoost = await wallet?.invoke?.updateBoost(boostUri, {
        status: boostStatus,
    });

    return updatedBoost;
};

export const sendBoostCredential = async (
    wallet: BespokeLearnCard,
    profileId: string,
    boostUri: string,
    options: { skipNotification: boolean } = {
        skipNotification: false,
    }
) => {
    if (!profileId) throw new Error('Send Boost Error, profileId is required, but none provided');
    if (!boostUri) throw new Error('Send Boost Error, boostUri is required, but none provided');
    // send boost to profileId
    const sentBoostUri = await wallet?.invoke?.sendBoost(profileId, boostUri, {
        skipNotification: options?.skipNotification,
        encrypt: true,
    });
    // anytime you use sendboost the crednetial sent to other person is wrapped

    // resolve uri to get credential
    const sentBoost = await wallet?.read?.get(sentBoostUri);
    // anytime you use sendboost the crednetial sent to other person is wrapped

    //  Return actual credential object
    return { sentBoost, sentBoostUri };
};

// Given a profile id and existing boost uri, send boost to profile id, save to LearnCloud
export const sendAndSaveBoostCredentialSelf = async (
    wallet: BespokeLearnCard,
    profileId: string,
    boostUri: string
) => {
    // TODO:
    // if boost status is DRAFT, set boost to LIVE then issue
    // if boost status is already live, then automatically boost user
    // oxlint-disable-next-line no-unused-vars
    const { sentBoost, sentBoostUri } = await sendBoostCredential(wallet, profileId, boostUri);
    const uri = await wallet.store.LearnCloud.uploadEncrypted?.(sentBoost);

    return uri;
};

// returns a URI after sending an existing boostUri to a profileId
export const addBoostSomeone = async (
    wallet: BespokeLearnCard,
    profileId: string,
    boostUri: string,
    options: { skipNotification: boolean } = {
        skipNotification: false,
    }
) => {
    const sentBoost = await wallet?.invoke?.sendBoost(profileId, boostUri, {
        skipNotification: options?.skipNotification,
        encrypt: true,
    });
    return sentBoost;
};

export const addAdmin = async (wallet: BespokeLearnCard, boostUri: string, profileId: string) => {
    const sentAdmin = await wallet?.invoke?.addBoostAdmin(boostUri, profileId);
    return sentAdmin;
};

export const removeAdmin = async (
    wallet: BespokeLearnCard,
    boostUri: string,
    profileId: string
) => {
    const adminRemoved = await wallet?.invoke?.removeBoostAdmin(boostUri, profileId);
    return adminRemoved;
};

export const getBoostAdmin = async (wallet: BespokeLearnCard, boostUri: string) => {
    const admin = wallet?.invoke?.getBoostAdmins(boostUri);
    return admin;
};

export const getDefaultAchievementTypeImage = (
    category: string,
    achievementType: string,
    currentBadgeImage: string,
    stylesPack: LCAStylesPackRegistryEntry[] | undefined
): string => {
    const filteredStylePackEntries: LCAStylesPackRegistryEntry[] | undefined =
        stylesPack?.filter(stylePackEntry => stylePackEntry?.category === category) || [];
    const defaultStylePackEntry: LCAStylesPackRegistryEntry | undefined =
        filteredStylePackEntries?.find(stylePackEntry => stylePackEntry.type === achievementType);

    const defaultAchievementTypeImages = filteredStylePackEntries.flatMap(
        stylePackEntry => stylePackEntry.url
    );
    const isDefaultAchievementTypeImage = defaultAchievementTypeImages.includes(currentBadgeImage);

    const isDefaultCategoryImage: boolean = defaultCategoryThumbImages.includes(currentBadgeImage);

    if (defaultStylePackEntry) return defaultStylePackEntry?.url;
    else if (!defaultStylePackEntry && !isDefaultAchievementTypeImage)
        return boostCategoryOptions[category]?.CategoryImage;
    // oxlint-disable-next-line no-dupe-else-if
    else if (!defaultStylePackEntry && !isDefaultCategoryImage && !isDefaultAchievementTypeImage)
        return currentBadgeImage;

    return boostCategoryOptions[category]?.CategoryImage;
};

export const getDefaultIDBackgroundImage = (category: string) => {
    if (
        category === BoostCategoryOptionsEnum.id ||
        category === BoostCategoryOptionsEnum.membership
    )
        return defaultIDCardImage;
    return '';
};

export const getDefaultBoostTitle = (category: string, achievementType: string) => {
    if (
        category === BoostCategoryOptionsEnum.id ||
        category === BoostCategoryOptionsEnum.membership
    ) {
        if (isCustomBoostType(achievementType)) {
            const customTypeTitle = replaceUnderscoresWithWhiteSpace(
                getAchievementTypeFromCustomType(achievementType)
            );

            return customTypeTitle;
        } else {
            const achievementTypeTitle = CATEGORY_TO_SUBCATEGORY_LIST?.[category].find(
                options => options?.type === achievementType
            )?.title;

            return achievementTypeTitle;
        }
    }

    return '';
};

export const getDefaultDisplayType = (category: string) => {
    if (category === BoostCategoryOptionsEnum.accomplishment) {
        return BoostCMSAppearanceDisplayTypeEnum.Media;
    }

    if (
        category === BoostCategoryOptionsEnum.socialBadge ||
        category === BoostCategoryOptionsEnum.workHistory
    ) {
        return BoostCMSAppearanceDisplayTypeEnum.Badge;
    }

    if (
        category === BoostCategoryOptionsEnum.id ||
        category === BoostCategoryOptionsEnum.membership
    ) {
        return BoostCMSAppearanceDisplayTypeEnum.ID;
    }

    if (
        category === BoostCategoryOptionsEnum.achievement ||
        category === BoostCategoryOptionsEnum.accommodation ||
        category === BoostCategoryOptionsEnum.learningHistory
    ) {
        return BoostCMSAppearanceDisplayTypeEnum.Certificate;
    }

    return BoostCMSAppearanceDisplayTypeEnum.Badge;
};

export const setQueryParam = (
    history: RouteComponentProps['history'],
    pathname: string,
    queryParamName: string,
    newValue: string
) => {
    if (history) {
        let searchParams = new URLSearchParams(window.location.search);
        searchParams.set(queryParamName, newValue);

        history.replace({
            pathname,
            search: searchParams.toString(),
        });
    } else {
        throw new Error('History object is required but missing');
    }
};

export const filterBoostRecipients = (recipients: BoostRecipientInfo[]) => {
    let _recipients: BoostRecipientInfo[] = [];

    if (recipients?.length > 0) {
        recipients?.forEach(recipient => {
            // rendering state.issueTo recipients
            if (!recipient.hasOwnProperty('to')) {
                _recipients.push(recipient);
                return;
            }

            // rendering boost recipients
            if (!_recipients?.find(_r => _r?.to?.profileId === recipient?.to?.profileId)) {
                _recipients.push(recipient);
            }
        });
    }

    return _recipients;
};

export const createBoost = async (vcInput: BoostCMSState, wallet: BespokeLearnCard) => {
    const walletDid = wallet?.id?.did();
    const currentDate = new Date()?.toISOString();

    const newCredential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
            {
                // id: '@id',
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                BoostCredential: {
                    '@id': 'https://www.example.org/boost-credential',
                    '@context': {
                        display: {
                            '@id': 'https://www.example.org/boost-display',
                            '@context': {
                                backgroundImage: {
                                    '@id': 'https://www.example.org/backgroundImage',
                                    '@type': 'xsd:string',
                                },
                                backgroundColor: {
                                    '@id': 'https://www.example.org/backgroundColor',
                                    '@type': 'xsd:string',
                                },
                            },
                        },
                        image: {
                            '@id': 'https://www.example.org/boost-image',
                            '@type': 'xsd:string',
                        },
                        attachments: {
                            '@id': 'https://www.example.org/boost-attachments',
                            '@container': '@set',
                            '@context': {
                                type: {
                                    '@id': 'https://www.example.org/attachmentType',
                                    '@type': 'xsd:string',
                                },
                                title: {
                                    '@id': 'https://www.example.org/attachmentTitle',
                                    '@type': 'xsd:string',
                                },
                                url: {
                                    '@id': 'https://www.example.org/attachmentUrl',
                                    '@type': 'xsd:string',
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: 'http://example.com/credentials/3527', // unique id
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        issuer: walletDid,
        issuanceDate: currentDate,
        name: vcInput?.basicInfo?.name, // title
        expirationDate: vcInput?.basicInfo?.expirationDate, // iso string
        credentialSubject: {
            id: walletDid,
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://example.com/achievements/21st-century-skills/teamwork',
                type: ['Achievement'],
                achievementType: vcInput.basicInfo.achievementType, // category type -> License
                criteria: {
                    narrative: vcInput?.basicInfo?.narrative, // criteria
                },
                description: vcInput?.basicInfo?.description, // description
                name: vcInput?.basicInfo?.name, // title
                image: vcInput?.appearance?.badgeThumbnail, // badge image
            },
        },
        display: {
            // appearance
            backgroundImage: vcInput?.appearance?.backgroundImage ?? '',
            backgroundColor: vcInput?.appearance?.backgroundColor ?? '',
        },
        image: vcInput?.appearance?.badgeThumbnail, // badge image,
        attachments: vcInput?.mediaAttachments, // media attachments
        //
    };

    const vc = await wallet.invoke.issueCredential(newCredential);

    const boostUri = await wallet.invoke.createBoost(vc, {
        name: vcInput?.basicInfo?.name,
        type: vcInput?.basicInfo.achievementType,
        category: vcInput?.basicInfo?.type,
    });

    return {
        vc,
        boostUri,
    };
};

export const isCredentialExpired = (credential: VC) => {
    if (!credential) return false;

    const { expirationDate } = credential;
    return !!expirationDate && Number(new Date(expirationDate)) < Number(new Date());
};

export const getLearnCardBoostTemplates = (selectedCategory: BoostCategoryOptionsEnum) => {
    let subCategoryTypes: { title: string; type: string; category: BoostCategoryOptionsEnum }[] =
        [];

    if (selectedCategory === BoostCategoryOptionsEnum.all) {
        const categoriesToFilterOut = [
            BoostCategoryOptionsEnum.skill,
            BoostCategoryOptionsEnum.membership,
            BoostCategoryOptionsEnum.job,
            BoostCategoryOptionsEnum.course,
            BoostCategoryOptionsEnum.currency,
            BoostCategoryOptionsEnum.describe,
            BoostCategoryOptionsEnum.family,
        ];
        subCategoryTypes = Object.entries(CATEGORY_TO_SUBCATEGORY_LIST)
            .filter(
                ([category]) =>
                    !categoriesToFilterOut.includes(category as BoostCategoryOptionsEnum)
            )
            .flatMap(([category, subCategories]) =>
                subCategories.map(subCategory => ({
                    ...subCategory,
                    category: category as BoostCategoryOptionsEnum,
                }))
            );
    } else {
        subCategoryTypes = (CATEGORY_TO_SUBCATEGORY_LIST[selectedCategory] ?? []).map(
            subCategory => ({
                ...subCategory,
                category: selectedCategory,
            })
        );
    }

    subCategoryTypes = subCategoryTypes?.sort(
        (a: { title: string; type: string }, b: { title: string; type: string }) => {
            const textA = a?.title?.toUpperCase();
            const textB = b?.title?.toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
        }
    );

    return subCategoryTypes;
};
