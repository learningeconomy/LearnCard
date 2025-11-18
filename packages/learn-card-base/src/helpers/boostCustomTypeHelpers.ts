export const CUSTOM_BOOST_TYPE_REGEX = /^([a-zA-Z]+\s*){3,25}$/;

export const capitalizeWordsAfterSpace = (str: string): string => {
    // ie: cool cat
    return str.replace(/(?:^|\s)\w/g, function (match) {
        // Cool Cat
        return match.toUpperCase();
    });
};

export const replaceWhiteSpacesWithUnderscores = (str: string): string => {
    if (!str) return '';
    // ie: Hell World
    return str.replace(/\s+/g, '_'); // Hello_World
};

export const replaceUnderscoresWithWhiteSpace = (str: string): string => {
    if (!str) return '';
    // ie: "Hello_World"
    return str.replace(/_/g, ' '); // Hello World
};

export const isCustomBoostType = (str: string): boolean => {
    const regex = /LCA_CUSTOM/;
    const result = regex.test(str);
    return result;
};

export const getAchievementTypeFromCustomType = (str: string) => {
    // ie: str -> "ext:LCA_CUSTOM:Learning History:The_Coolest_Dog";
    const regex = /^((?:[^:]+:){3})([^:]+)/;
    const result = str.match(regex)?.[2]; // "The_Coolest_Dog"
    return result;
};

export const getCategoryTypeFromCustomType = (str: string) => {
    // ie: str -> "ext:LCA_CUSTOM:Learning History:The_Coolest_Dog";
    const regex = /(?:[^:]*:){2}([^:]*)(?::|$)/;
    const result = str.match(regex)?.[1]; // "Learning History"
    return result;
};

export const constructCustomBoostType = (categoryType: string, customAchievementType: string) => {
    const capitalizedAchievementType = capitalizeWordsAfterSpace(customAchievementType);
    const transformedAchievementType = replaceWhiteSpacesWithUnderscores(
        capitalizedAchievementType
    );
    return `ext:LCA_CUSTOM:${categoryType}:${transformedAchievementType}`; // "ext:LCA_CUSTOM:Learning History:The_Coolest_Dog";
};
