import React, { useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, documentTextOutline } from 'ionicons/icons';
import type { VC } from '@learncard/types';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import { getCredentialName, getIssuerName } from 'learn-card-base/helpers/credentialHelpers';
import * as m from '../../paraglide/messages.js';

export type CredentialReceiveScreenProps = {
    credentials: VC[];
    walletDid?: string;
    origin?: string;
    loading?: boolean;
    connecting?: boolean;
    saving?: boolean;
    savedCount?: number;
    complete?: boolean;
    dismissed?: boolean;
    error?: 'invalid' | 'request' | 'save' | 'response' | 'account' | 'cancel';
    onAccept?: () => void;
    onReject?: () => void;
};

export const CredentialReceiveScreen = ({
    credentials,
    walletDid,
    origin,
    loading,
    connecting,
    saving,
    savedCount = 0,
    complete,
    dismissed,
    error,
    onAccept,
    onReject,
}: CredentialReceiveScreenProps) => {
    const [expanded, setExpanded] = useState<number[]>([]);
    const errorText = error ? m[`chapi.receive.error.${error}`]() : undefined;
    return (
        <IonPage>
            <IonContent fullscreen className="font-poppins [--background:#EFF0F5]">
                <main className="mx-auto w-full max-w-[640px] px-4 py-6 sm:py-10">
                    <div className="bg-white rounded-[20px] border border-grayscale-200 overflow-hidden shadow-xs">
                        <header className="p-6 border-b border-grayscale-200">
                            <div className="w-12 h-12 mb-4 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <IonIcon
                                    icon={documentTextOutline}
                                    className="text-2xl"
                                    aria-hidden="true"
                                />
                            </div>
                            <h1 className="text-xl font-semibold text-grayscale-900">
                                {connecting
                                    ? m['chapi.receive.connectTitle']()
                                    : m['chapi.receive.title']()}
                            </h1>
                            <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                                {connecting
                                    ? m['chapi.receive.connectDescription']()
                                    : m['chapi.receive.description']()}
                            </p>
                            {origin && (
                                <p className="mt-3 text-xs text-grayscale-700 break-all">
                                    {m['chapi.receive.from']({ origin })}
                                </p>
                            )}
                        </header>
                        <div className="p-6 space-y-v3-4" aria-live="polite">
                            {loading && (
                                <div
                                    role="status"
                                    className="flex items-center gap-3 py-6 text-sm text-grayscale-600"
                                >
                                    <span className="w-5 h-5 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin" />
                                    {connecting
                                        ? m['chapi.receive.connecting']()
                                        : m['chapi.receive.loading']()}
                                </div>
                            )}
                            {errorText && (
                                <div
                                    role="alert"
                                    className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
                                >
                                    <IonIcon
                                        icon={alertCircleOutline}
                                        className="text-red-400 text-lg mt-0.5 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span className="text-sm text-red-700 leading-relaxed">
                                        {errorText}
                                    </span>
                                </div>
                            )}
                            {dismissed && (
                                <p role="status" className="text-sm text-grayscale-600">
                                    {m['chapi.receive.cancelled']()}
                                </p>
                            )}
                            {savedCount > 0 && (dismissed || error === 'cancel') && (
                                <p role="status" className="text-sm text-grayscale-600">
                                    {m['chapi.receive.savedBeforeCancel']({ saved: savedCount })}
                                </p>
                            )}
                            {complete && (
                                <div
                                    role="status"
                                    className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5"
                                >
                                    <IonIcon
                                        icon={checkmarkCircleOutline}
                                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span className="text-sm text-emerald-700 leading-relaxed">
                                        {m['chapi.receive.saved']()}
                                    </span>
                                </div>
                            )}
                            {credentials.map((credential, index) => (
                                <details
                                    key={index}
                                    onToggle={event => {
                                        const open = event.currentTarget.open;
                                        setExpanded(items =>
                                            open
                                                ? [...items.filter(item => item !== index), index]
                                                : items.filter(item => item !== index)
                                        );
                                    }}
                                    className="rounded-[20px] border border-grayscale-200 overflow-hidden group"
                                >
                                    <summary className="p-4 flex items-center gap-3 cursor-pointer list-none hover:bg-grayscale-10 transition-colors">
                                        <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-grayscale-100 text-grayscale-600 shrink-0">
                                            <IonIcon
                                                icon={documentTextOutline}
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-grayscale-900 wrap-break-word">
                                                {getCredentialName(credential) ||
                                                    m['chapi.receive.credential']()}
                                            </span>
                                            <span className="block text-xs text-grayscale-600 mt-1 wrap-break-word">
                                                {getIssuerName(credential) ||
                                                    m['chapi.receive.issuerUnavailable']()}
                                            </span>
                                        </span>
                                        <span className="text-xs font-medium text-grayscale-700 underline shrink-0">
                                            {m['chapi.receive.details']()}
                                        </span>
                                    </summary>
                                    <div className="p-4 border-t border-grayscale-200">
                                        {expanded.includes(index) && (
                                            <VCDisplayCardWrapper2
                                                credential={credential}
                                                walletDid={walletDid}
                                                hideNavButtons
                                                hideQRCode
                                            />
                                        )}
                                    </div>
                                </details>
                            ))}
                            {credentials.length > 1 && (
                                <p className="text-xs text-grayscale-600">
                                    {m['chapi.receive.progress']({
                                        saved: savedCount,
                                        total: credentials.length,
                                    })}
                                </p>
                            )}
                        </div>
                        {!complete &&
                            !dismissed &&
                            error !== 'response' &&
                            error !== 'cancel' &&
                            (onReject || credentials.length > 0) && (
                                <footer className="sticky bottom-0 p-6 bg-white border-t border-grayscale-200 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={onReject}
                                        disabled={saving || !onReject}
                                        className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {m['chapi.receive.cancel']()}
                                    </button>
                                    {credentials.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={onAccept}
                                            disabled={loading || saving || !onAccept}
                                            className="flex-1 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {saving ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    {m['chapi.receive.saving']()}
                                                </span>
                                            ) : error ? (
                                                m['chapi.receive.retry']()
                                            ) : (
                                                m['chapi.receive.accept']()
                                            )}
                                        </button>
                                    )}
                                </footer>
                            )}
                    </div>
                </main>
            </IonContent>
        </IonPage>
    );
};
