export type DataDeletionStatus = {
    status: 'complete' | 'incomplete' | 'error';
};

export const createDataDeletionResponse = <T extends DataDeletionStatus>(
    result: T,
    jsonResponse: (data: T, status: number) => Response,
    authCookieName: string
) => {
    const response = jsonResponse(
        result,
        result.status === 'complete' ? 200 : result.status === 'incomplete' ? 202 : 503
    );
    response.headers.set('Cache-Control', 'no-store');

    if (result.status === 'complete')
        response.headers.set(
            'Set-Cookie',
            `${authCookieName}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`
        );

    return response;
};
