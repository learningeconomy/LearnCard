import { useState, useCallback, useEffect } from 'react';
import { LearnCardConnect } from '@learncard/react';
import '@learncard/react/dist/main.css';
import { generateTestData } from '../helpers/testDataGenerator';

const API_KEY_STORAGE_KEY = 'learn-card-connect-test-api-key';

interface ContextData {
    prompt: string;
    metadata: {
        did: string;
        name?: string;
    };
}

interface LearnCardError {
    code: string;
    message: string;
}

export default function TestApp() {
    const [context, setContext] = useState<ContextData | null>(null);
    const [error, setError] = useState<LearnCardError | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<string[]>([]);
    const [apiKey, setApiKey] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
        }
        return '';
    });

    useEffect(() => {
        if (apiKey) {
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        }
    }, [apiKey]);

    const handleContextReady = useCallback((ctx: ContextData) => {
        console.log('Context received:', ctx);
        setContext(ctx);
        setError(null);
    }, []);

    const handleError = useCallback((err: LearnCardError) => {
        console.error('LearnCard Connect Error:', err);
        setError(err);
        setContext(null);
    }, []);

    const handleGenerateTestData = useCallback(async () => {
        setIsGenerating(true);
        setGenerationStatus([]);

        try {
            const updateStatus = (msg: string) => {
                setGenerationStatus((prev: string[]) => [...prev, msg]);
            };

            const generatedApiKey = await generateTestData(updateStatus);
            setApiKey(generatedApiKey);
            localStorage.setItem(API_KEY_STORAGE_KEY, generatedApiKey);
            updateStatus('✅ Test data generation complete!');
            updateStatus('💾 API key saved to localStorage');
        } catch (err) {
            console.error('Test data generation failed:', err);
            const message = err instanceof Error ? err.message : String(err);
            setGenerationStatus((prev: string[]) => [...prev, `❌ Error: ${message}`]);
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return (
        <div
            style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '40px 20px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            <h1 style={{ marginBottom: '10px' }}>LearnCard Connect Test App</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Test the LearnCardConnect React SDK component
            </p>

            <div
                style={{
                    background: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                }}
            >
                <h2 style={{ marginTop: 0, fontSize: '18px' }}>Step 1: Generate Test Data</h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                    First, generate test data including LCN accounts, consent contracts, and
                    credentials. Make sure <code>pnpm dev</code> is running in{' '}
                    <code>apps/learn-card-app</code>.
                </p>

                <button
                    type="button"
                    onClick={handleGenerateTestData}
                    disabled={isGenerating}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: isGenerating ? '#ccc' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                    }}
                >
                    {isGenerating ? 'Generating...' : 'Generate Test Data'}
                </button>

                {generationStatus.length > 0 && (
                    <div
                        style={{
                            marginTop: '15px',
                            padding: '15px',
                            background: 'white',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            maxHeight: '200px',
                            overflow: 'auto',
                        }}
                    >
                        {generationStatus.map((status, i) => (
                            <div key={`${i}-${status}`} style={{ marginBottom: '4px' }}>
                                {status}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div
                style={{
                    background: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                }}
            >
                <h2 style={{ marginTop: 0, fontSize: '18px' }}>Step 2: Test LearnCardConnect</h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                    Click the button below to test the LearnCardConnect component. It should open a
                    modal, authenticate as the demo user, and fetch consented context.
                </p>

                {apiKey ? (
                    <div>
                        <LearnCardConnect
                            apiKey={apiKey}
                            onContextReady={handleContextReady}
                            onError={handleError}
                            buttonText="Personalize with LearnCard"
                            mode="modal"
                            hostOrigin="http://localhost:3000"
                            requestTimeout={9999999999999}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setApiKey('');
                                localStorage.removeItem(API_KEY_STORAGE_KEY);
                            }}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                            }}
                        >
                            Clear API Key
                        </button>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: '12px',
                            background: '#fff3cd',
                            borderRadius: '6px',
                            color: '#856404',
                            fontSize: '14px',
                        }}
                    >
                        ⚠️ Please generate test data first to get an API key.
                    </div>
                )}
            </div>

            {context && (
                <div
                    style={{
                        background: '#ecfdf5',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                    }}
                >
                    <h2 style={{ marginTop: 0, fontSize: '18px', color: '#065f46' }}>
                        ✅ Context Received
                    </h2>
                    <div
                        style={{
                            background: 'white',
                            padding: '15px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            overflow: 'auto',
                        }}
                    >
                        <pre style={{ margin: 0 }}>{JSON.stringify(context, null, 2)}</pre>
                    </div>
                </div>
            )}

            {error && (
                <div
                    style={{
                        background: '#fef2f2',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                    }}
                >
                    <h2 style={{ marginTop: 0, fontSize: '18px', color: '#991b1b' }}>❌ Error</h2>
                    <p style={{ color: '#b91c1c' }}>
                        <strong>{error.code}:</strong> {error.message}
                    </p>
                </div>
            )}

            <div
                style={{
                    background: '#eff6ff',
                    padding: '20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                }}
            >
                <h2 style={{ marginTop: 0, fontSize: '16px' }}>How it works:</h2>
                <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>
                        Click "Generate Test Data" to set up test accounts and consent contracts
                    </li>
                    <li>Click "Personalize with LearnCard" to open the LearnCard auth modal</li>
                    <li>Sign in with the demo account (demo@learningeconomy.io / password)</li>
                    <li>The SDK fetches consented data and returns a formatted prompt</li>
                </ol>
            </div>
        </div>
    );
}
