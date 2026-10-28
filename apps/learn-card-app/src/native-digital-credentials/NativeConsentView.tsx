import React from 'react';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    checkmark,
    documentTextOutline,
    phonePortraitOutline,
} from 'ionicons/icons';
import * as m from '../paraglide/messages.js';

export interface NativeRequesterIdentity {
    name?: string;
    packageName?: string;
    origin: string;
}

export interface NativeConsentCredential {
    cacheKey: string;
    title: string;
    issuer?: string;
    credentialType?: string;
    expires?: string;
    loading: boolean;
    available: boolean;
    fields: Array<{ key: string; label: string; value: string; checked: boolean }>;
}

interface NativeConsentViewProps {
    requester: NativeRequesterIdentity;
    credentials: NativeConsentCredential[];
    canShare: boolean;
    requiredFieldsApproved: boolean;
    loading: boolean;
    submitting: boolean;
    canceling: boolean;
    onFieldChange: (cacheKey: string, key: string, checked: boolean) => void;
    onApprove: () => void;
    onCancel: () => void;
}

/** Native presentation of the shared consent model; selection and approval remain in RequestConsent. */
export const NativeConsentView: React.FC<NativeConsentViewProps> = ({
    requester,
    credentials,
    canShare,
    requiredFieldsApproved,
    loading,
    submitting,
    canceling,
    onFieldChange,
    onApprove,
    onCancel,
}) => {
    const busy = submitting || canceling;
    const name =
        requester.name && requester.name !== requester.packageName
            ? requester.name
            : m['nativeCredentials.androidApp']();
    const identifier = requester.packageName || requester.name;

    return (
        <div
            className="min-h-full flex flex-col bg-grayscale-10 font-poppins"
            style={{ paddingTop: 'var(--ion-safe-area-top, 0px)' }}
        >
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
                <div className="space-y-5 px-5 pb-5 pt-6 sm:px-6">
                    <header>
                        <h1 className="mb-1 text-xl font-semibold text-grayscale-900">
                            {m['nativeCredentials.reviewTitle']()}
                        </h1>
                        <p className="text-sm leading-relaxed text-grayscale-600">
                            {m['nativeCredentials.reviewDescription']()}
                        </p>
                    </header>

                    <section className="rounded-[20px] border border-grayscale-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grayscale-100">
                                <IonIcon
                                    icon={phonePortraitOutline}
                                    aria-hidden="true"
                                    className="text-xl text-grayscale-700"
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-grayscale-600">
                                    {m['nativeCredentials.requestedBy']()}
                                </p>
                                <p className="break-words text-sm font-semibold text-grayscale-900">
                                    {name}
                                </p>
                                {identifier && identifier !== name && (
                                    <p
                                        dir="ltr"
                                        className="mt-0.5 break-all text-xs text-grayscale-600"
                                    >
                                        {identifier}
                                    </p>
                                )}
                            </div>
                        </div>
                        <details className="mt-2 border-t border-grayscale-100">
                            <summary className="cursor-pointer py-3 text-xs font-medium text-grayscale-600 focus-visible:outline-emerald-600">
                                {m['nativeCredentials.requestDetails']()}
                            </summary>
                            <p className="mb-1 text-xs font-medium text-grayscale-700">
                                {m['nativeCredentials.requestIdentity']()}
                            </p>
                            <p
                                dir="ltr"
                                className="break-all pb-1 text-xs leading-relaxed text-grayscale-600"
                            >
                                {requester.origin}
                            </p>
                        </details>
                    </section>

                    {credentials.map(credential => (
                        <section
                            key={credential.cacheKey}
                            className="overflow-hidden rounded-[20px] border border-grayscale-200 bg-white"
                        >
                            <div className="flex items-center gap-3 border-b border-grayscale-100 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                                    <IonIcon
                                        icon={documentTextOutline}
                                        aria-hidden="true"
                                        className="text-xl text-emerald-700"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-grayscale-600">
                                        {m['nativeCredentials.selectedCredential']()}
                                    </p>
                                    <h2 className="break-words text-sm font-semibold text-grayscale-900">
                                        {credential.title}
                                    </h2>
                                </div>
                            </div>

                            <fieldset disabled={busy} className="min-w-0">
                                <legend className="sr-only">
                                    {m['nativeCredentials.requestedDetails']()}
                                </legend>
                                {credential.loading ? (
                                    <p role="status" className="p-4 text-sm text-grayscale-600">
                                        {m['common.loadingClaims']()}
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-grayscale-100">
                                        {credential.fields.map(field => (
                                            <li key={field.key}>
                                                <label className="flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-grayscale-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.checked}
                                                        onChange={event =>
                                                            onFieldChange(
                                                                credential.cacheKey,
                                                                field.key,
                                                                event.target.checked
                                                            )
                                                        }
                                                        className="peer sr-only"
                                                    />
                                                    <span
                                                        aria-hidden="true"
                                                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 ${field.checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-grayscale-300 bg-white text-transparent'}`}
                                                    >
                                                        <IonIcon
                                                            icon={checkmark}
                                                            className="text-sm"
                                                        />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                                                            <span className="text-sm font-medium text-grayscale-900">
                                                                {field.label}
                                                            </span>
                                                            <span className="text-xs text-grayscale-600">
                                                                {m['nativeCredentials.required']()}
                                                            </span>
                                                        </span>
                                                        <span
                                                            dir="auto"
                                                            className="mt-1 block break-words text-sm leading-relaxed text-grayscale-600"
                                                        >
                                                            {field.checked
                                                                ? field.value
                                                                : m[
                                                                      'nativeCredentials.notShared'
                                                                  ]()}
                                                        </span>
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </fieldset>

                            {!credential.available && (
                                <p role="alert" className="p-4 text-sm text-red-700">
                                    {m['nativeCredentials.unavailableTitle']()}
                                </p>
                            )}
                            <div className="border-t border-grayscale-100 px-4">
                                <p className="pt-3 text-xs leading-relaxed text-grayscale-600">
                                    {m['nativeCredentials.metadataIncluded']()}
                                </p>
                                <details>
                                    <summary className="cursor-pointer py-3 text-xs font-medium text-grayscale-600 focus-visible:outline-emerald-600">
                                        {m['nativeCredentials.credentialDetails']()}
                                    </summary>
                                    <dl className="space-y-2 pb-4 text-xs text-grayscale-600">
                                        {[
                                            [m['nativeCredentials.issuer'](), credential.issuer],
                                            [
                                                m['nativeCredentials.credentialType'](),
                                                credential.credentialType,
                                            ],
                                            [m['nativeCredentials.expires'](), credential.expires],
                                        ]
                                            .filter(([, value]) => value)
                                            .map(([label, value]) => (
                                                <div key={label}>
                                                    <dt className="font-medium text-grayscale-700">
                                                        {label}
                                                    </dt>
                                                    <dd
                                                        dir="auto"
                                                        className="mt-0.5 break-all leading-relaxed"
                                                    >
                                                        {value}
                                                    </dd>
                                                </div>
                                            ))}
                                    </dl>
                                </details>
                            </div>
                        </section>
                    ))}
                </div>

                <footer
                    className="sticky bottom-0 mt-auto space-y-3 border-t border-grayscale-200 bg-white px-5 pt-4 sm:px-6"
                    style={{ paddingBottom: 'max(1rem, var(--ion-safe-area-bottom, 0px))' }}
                >
                    {!requiredFieldsApproved && !loading && (
                        <p
                            role="status"
                            className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"
                        >
                            <IonIcon
                                icon={alertCircleOutline}
                                aria-hidden="true"
                                className="mt-0.5 shrink-0 text-base"
                            />
                            {m['nativeCredentials.requiredFields']()}
                        </p>
                    )}
                    <button
                        onClick={onApprove}
                        disabled={!canShare}
                        className="w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="flex items-center justify-center gap-2" aria-live="polite">
                            {(submitting || loading) && (
                                <span
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                />
                            )}
                            {submitting
                                ? m['nativeCredentials.sharing']()
                                : loading
                                  ? m['common.loadingClaims']()
                                  : m['nativeCredentials.shareDetails']()}
                        </span>
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={busy}
                        className="w-full rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 focus-visible:outline-emerald-600 disabled:opacity-40"
                    >
                        <span className="flex items-center justify-center gap-2">
                            {canceling && (
                                <span
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-grayscale-300 border-t-grayscale-700"
                                />
                            )}
                            {canceling ? m['nativeCredentials.canceling']() : m['common.cancel']()}
                        </span>
                    </button>
                </footer>
            </div>
        </div>
    );
};
