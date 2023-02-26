export const getBaseUrl = (url: string) => {
    return url.replace(/(https?:\/\/(www\.)?)/, '').split('/')[0];
};
