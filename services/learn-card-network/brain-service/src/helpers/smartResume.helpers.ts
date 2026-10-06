import { environment } from '@environment';
import { ConsentFlowTermsValidator, type ConsentFlowTerms } from '@learncard/types';
import { resolveUri } from '@helpers/uri.helpers';

/** Publish only the terms returned by the locked consent/publication claim. */
export const uploadSmartResume = async (
    terms: ConsentFlowTerms,
    did: string,
    recipientToken: string
): Promise<string | undefined> => {
    const isProduction = !environment.IS_OFFLINE;

    const srUrl = isProduction ? 'https://my.smartresume.com/' : 'https://mystage.smartresume.com/';
    const clientId = environment.SMART_RESUME_CLIENT_ID;
    const accessKey = environment.SMART_RESUME_ACCESS_KEY;

    const accessTokenResponse = (await fetch(`${srUrl}api/v1/token`, {
        method: 'POST',
        signal: AbortSignal.timeout(30_000),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${clientId}:${accessKey}`)}`,
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'delete readonly replace',
        }),
    }).then(res => {
        if (!res.ok) throw new Error(`SmartResume token request failed (${res.status})`);
        return res.json();
    })) as { access_token?: string };

    const accessToken = accessTokenResponse.access_token;
    if (!accessToken) throw new Error('Missing access_token for SmartResume');

    const parsedTerms = ConsentFlowTermsValidator.parse(terms);

    const categories = parsedTerms.read.credentials.categories;
    const categoryValues = Object.values(categories) as Array<{ shared?: string[] }>;

    const allSharedCredentialUris = [
        // filter out duplicates
        ...new Set(categoryValues.flatMap(({ shared }) => shared ?? [])),
    ];

    const resolvedCredentials = await Promise.all(
        allSharedCredentialUris.map(async uri => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            try {
                return await Promise.race([
                    resolveUri(uri),
                    new Promise<never>((_, reject) => {
                        timer = setTimeout(
                            () => reject(new Error('Credential resolution timed out')),
                            30_000
                        );
                    }),
                ]);
            } finally {
                clearTimeout(timer);
            }
        })
    );

    type ResolvedCredential = {
        issuer?: string | { id: string };
        id?: string;
        boostCredential?: Record<string, unknown>;
    } & Record<string, unknown>;

    const credentials = resolvedCredentials
        .filter((cred): cred is ResolvedCredential => typeof cred === 'object' && cred !== null)
        .map(cred =>
            cred.boostCredential && typeof cred.boostCredential === 'object'
                ? ({ ...cred.boostCredential, id: cred.id } as ResolvedCredential) // unwrap credential, preserve id
                : cred
        );

    const transformedCredentials = credentials.map(cred => {
        const issuer =
            typeof cred.issuer === 'string' ? { id: cred.issuer } : cred.issuer || { id: '' };

        return {
            ...cred,
            issuer,
        };
    });

    const { name, email } = parsedTerms.read.personal;

    const body = JSON.stringify({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://w3id.org/security/suites/ed25519-2020/v1',
        ],
        recipienttoken: recipientToken,
        recipient: {
            id: did,
            givenName: name && name !== 'Anonymous' ? name : '',
            familyName: '', // this is necessary in order for givenName to be respected
            email: email && email !== 'anonymous@hidden.com' ? email : '',
        },
        credentials: transformedCredentials,
    });

    const response = await fetch(`${srUrl}api/v1/credentials`, {
        method: 'POST',
        signal: AbortSignal.timeout(30_000),
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body,
    });

    if (!response.ok) {
        throw new Error(`SmartResume upload failed (${response.status})`);
    }

    const result = (await response.json()) as { redirect_url?: string };
    return result.redirect_url;
};
