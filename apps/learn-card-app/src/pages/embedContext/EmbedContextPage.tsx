import { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { useAuthCoordinator } from 'learn-card-base';
import { networkLearnCardFromApiKey } from '@learncard/init';

const DEFAULT_AI_URL = 'https://api.learncloud.ai';

interface ContextData {
    prompt: string;
    metadata: {
        did: string;
        name?: string;
        [key: string]: unknown;
    };
    structuredContext?: unknown;
    credentials?: unknown[];
}

const EmbedContextPage = () => {
    const [status, setStatus] = useState<'loading' | 'authenticating' | 'fetching' | 'error'>(
        'loading'
    );
    const [errorMessage, setErrorMessage] = useState('');
    const { state, currentUser } = useAuthCoordinator();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const apiKey = urlParams.get('apiKey');
        const requestId = urlParams.get('requestId');
        const instructions = urlParams.get('instructions') || undefined;
        const detailLevel = (urlParams.get('detailLevel') as 'compact' | 'expanded') || 'compact';
        const includeRawCredentials = urlParams.get('includeRawCredentials') === 'true';

        if (!apiKey || !requestId) {
            setStatus('error');
            setErrorMessage('Missing required parameters');
            return;
        }

        if (state !== 'ready' || !currentUser?.did) {
            setStatus('authenticating');
            return;
        }

        const fetchContext = async () => {
            try {
                setStatus('fetching');

                const wallet = await networkLearnCardFromApiKey({ apiKey });

                const consentedData = await wallet.invoke.getConsentedDataForDid(currentUser.did, {
                    limit: 50,
                });

                const credentials = consentedData.records.map(record => record.credential);

                const response = await fetch(`${DEFAULT_AI_URL}/ai/learner-context/format`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        credentials,
                        personalData: {
                            did: currentUser.did,
                            name: currentUser.name,
                        },
                        instructions,
                        detailLevel,
                        maxCredentials: credentials.length,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to format learner context: ${response.statusText}`);
                }

                const data = (await response.json()) as {
                    prompt: string;
                    metadata: unknown;
                    structuredContext?: unknown;
                };

                const contextData: ContextData = {
                    prompt: data.prompt,
                    metadata: {
                        did: currentUser.did,
                        name: currentUser.name,
                        ...(data.metadata || {}),
                    },
                    structuredContext: data.structuredContext,
                };

                if (includeRawCredentials) {
                    contextData.credentials = credentials;
                }

                const message = {
                    protocol: 'LEARNCARD_V1',
                    requestId,
                    type: 'SUCCESS',
                    data: contextData,
                };

                if (window.opener) {
                    window.opener.postMessage(message, '*');
                    window.close();
                } else if (window.parent !== window) {
                    window.parent.postMessage(message, '*');
                }
            } catch (error) {
                setStatus('error');
                setErrorMessage(error instanceof Error ? error.message : 'Unknown error');

                const errorMessage = {
                    protocol: 'LEARNCARD_V1',
                    requestId,
                    type: 'ERROR',
                    error: {
                        code: 'FETCH_ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                };

                if (window.opener) {
                    window.opener.postMessage(errorMessage, '*');
                } else if (window.parent !== window) {
                    window.parent.postMessage(errorMessage, '*');
                }
            }
        };

        fetchContext();
    }, [state, currentUser]);

    if (status === 'authenticating') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                }}
            >
                <IonSpinner name="crescent" style={{ width: 48, height: 48 }} />
                <p style={{ marginTop: 16, fontSize: 16 }}>Please sign in to continue...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                }}
            >
                <div
                    style={{
                        color: '#dc2626',
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 8,
                    }}
                >
                    Error
                </div>
                <p style={{ color: '#666', textAlign: 'center' }}>{errorMessage}</p>
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                padding: '20px',
            }}
        >
            <IonSpinner name="crescent" style={{ width: 48, height: 48 }} />
            <p style={{ marginTop: 16, fontSize: 16 }}>
                {status === 'fetching' ? 'Fetching your learning context...' : 'Loading...'}
            </p>
        </div>
    );
};

export default EmbedContextPage;
