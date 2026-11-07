import { enterSharePrivacy } from '../../components/share-links/sharePrivacy';
import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { getAnonymousClient } from '@learncard/network-brain-client';
import { networkStore } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const UnsubscribePage: React.FC = () => {
    const { search } = useLocation();
    const token = new URLSearchParams(search).get('token');
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
    useEffect(() => {
        enterSharePrivacy();
        let active = true;
        setState('loading');
        const unsubscribe = async (): Promise<void> => {
            try {
                if (!token) throw new Error('Missing token');
                await getAnonymousClient(
                    networkStore.get.networkUrl()
                ).campaigns.unsubscribe.mutate({ token });
                if (active) setState('success');
            } catch {
                if (active) setState('error');
            }
        };
        void unsubscribe();
        return () => {
            active = false;
        };
    }, [token, attempt]);
    return (
        <IonPage>
            <IonContent>
                <main className="min-h-full flex items-center justify-center bg-grayscale-100 p-6 font-poppins">
                    <section className="w-full max-w-md rounded-[20px] bg-white p-8 text-center space-y-5">
                        <h1 className="text-xl font-semibold text-grayscale-900">
                            {m['announcements.title']()}
                        </h1>
                        {state === 'loading' && (
                            <div role="status" className="text-grayscale-600">
                                <IonSpinner aria-hidden="true" />
                                <p>{m['announcements.unsubscribing']()}</p>
                            </div>
                        )}
                        {state === 'success' && (
                            <p role="status" className="text-emerald-700">
                                {m['announcements.unsubscribed']()}
                            </p>
                        )}
                        {state === 'error' && (
                            <>
                                <p
                                    role="alert"
                                    className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700"
                                >
                                    {m['announcements.error']()}
                                </p>
                                <button
                                    type="button"
                                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm"
                                    onClick={() => setAttempt(value => value + 1)}
                                >
                                    {m['announcements.retry']()}
                                </button>
                            </>
                        )}
                    </section>
                </main>
            </IonContent>
        </IonPage>
    );
};
export default UnsubscribePage;
