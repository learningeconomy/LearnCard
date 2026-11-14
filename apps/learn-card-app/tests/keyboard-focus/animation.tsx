// Synthetic native fixture: no auth, account data, or backend requests.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp, IonContent, IonPage, setupIonicReact } from '@ionic/react';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { KeyboardFocusManager } from '../../../../packages/learn-card-base/src/components/keyboard/KeyboardFocusManager';
import '@ionic/react/css/core.css';
setupIonicReact();
void SplashScreen.hide();

const useFocusManager = new URLSearchParams(location.search).get('focusManager') !== '0';
const telemetry = new URLSearchParams(location.search).get('telemetry') === '1';
const samples: unknown[] = [];
let recording = false;
const sample = (event: string) => {
    const host = document.querySelector('ion-app')?.getBoundingClientRect();
    samples.push({
        t: performance.now(),
        event,
        useFocusManager,
        innerHeight,
        visual: visualViewport?.height,
        hostBottom: host?.bottom,
        open: document.documentElement.hasAttribute('data-lc-keyboard-open'),
        cssHeight: document.documentElement.style.getPropertyValue('--lc-keyboard-viewport-height'),
    });
};
for (const event of [
    'keyboardWillShow',
    'keyboardDidShow',
    'keyboardWillHide',
    'keyboardDidHide',
] as const) {
    void Keyboard.addListener(event, () => {
        sample(event);
        if (recording) return;
        recording = true;
        const end = performance.now() + 1600;
        const frame = () => {
            sample('frame');
            if (performance.now() < end) requestAnimationFrame(frame);
            else {
                recording = false;
                if (telemetry)
                    void fetch('http://127.0.0.1:3039/geometry', {
                        method: 'POST',
                        body: JSON.stringify(samples.splice(0)),
                        headers: { 'Content-Type': 'application/json' },
                    });
            }
        };
        requestAnimationFrame(frame);
    });
}
createRoot(document.getElementById('root')!).render(
    <>
        {useFocusManager && <KeyboardFocusManager />}
        <IonApp>
            <IonPage>
                <IonContent style={{ '--background': '#EFF0F5' }}>
                    <div
                        style={{
                            padding: '24px',
                            color: '#18224E',
                            fontFamily: 'sans-serif',
                            minHeight: '100%',
                        }}
                    >
                        <h1>Keyboard animation review</h1>
                        <p>Synthetic form, no account data</p>
                        <label>
                            Search
                            <input
                                aria-label="Search"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: 16,
                                    borderRadius: 12,
                                    border: '1px solid #A8ACBD',
                                }}
                            />
                        </label>
                        <button
                            onClick={() => {
                                (document.activeElement as HTMLElement)?.blur();
                            }}
                            style={{ padding: 16, marginTop: 24 }}
                        >
                            Dismiss keyboard
                        </button>
                        <div style={{ height: 200 }} />
                        <label>
                            Lower field
                            <input
                                aria-label="Lower field"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: 16,
                                }}
                            />
                        </label>
                    </div>
                </IonContent>
            </IonPage>
        </IonApp>
    </>
);
