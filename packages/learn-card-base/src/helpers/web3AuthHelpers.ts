export const web3AuthTypeOfLoginEnum = {
    discord: 'discord',
};

export const transformWeb3AuthProfileImage = (
    profileImageUrl: string | undefined,
    typeOfLogin?: string
): string => {
    if (!typeOfLogin) return profileImageUrl ?? '';

    let _profileImageUrl = profileImageUrl;
    if (typeOfLogin === web3AuthTypeOfLoginEnum.discord) {
        _profileImageUrl = profileImageUrl?.replace('cdn.discord.com', 'cdn.discordapp.com');
    }

    return _profileImageUrl ?? '';
};
