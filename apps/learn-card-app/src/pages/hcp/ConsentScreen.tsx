import React from 'react';

import * as m from '../../paraglide/messages.js';
import type { AccessRequest, Duration } from './consentLink';
import { categoryName } from './hcpModel';
import { Spinner } from './HcpStates';

const durationText = (duration: Duration): string => {
    switch (duration) {
        case '1h':
            return m['hcp.connect.for1h']();
        case '4h':
            return m['hcp.connect.for4h']();
        case '24h':
            return m['hcp.connect.for24h']();
        case 'ongoing':
            return m['hcp.connect.untilStopped']();
        default: {
            const _exhaustive: never = duration;
            return _exhaustive;
        }
    }
};

/** Presentational: what the app asks for, and Allow / Don't allow. */
const ConsentScreen: React.FC<{
    request: AccessRequest;
    pending: boolean;
    failed: boolean;
    onAllow: () => void;
    onDeny: () => void;
}> = ({ request, pending, failed, onAllow, onDeny }) => (
    <div className="space-y-5">
        <div>
            <h2 className="text-[20px] font-semibold text-grayscale-900 mb-1">
                {m['hcp.connect.title']({ app: request.client.name })}
            </h2>
            <p className="text-sm text-grayscale-600">{m['hcp.connect.readOnly']()}</p>
        </div>
        <section className="p-4 bg-white rounded-2xl border border-grayscale-200 space-y-3">
            <div>
                <p className="text-xs font-medium text-grayscale-500 mb-1">
                    {m['hcp.connect.whatLabel']()}
                </p>
                <ul className="list-disc pl-5 text-sm text-grayscale-900">
                    {request.categories.map(id => (
                        <li key={id}>{categoryName(id)}</li>
                    ))}
                </ul>
            </div>
            <div>
                <p className="text-xs font-medium text-grayscale-500 mb-1">
                    {m['hcp.connect.whyLabel']()}
                </p>
                <p className="text-sm text-grayscale-900">{request.purpose.description}</p>
            </div>
            <div>
                <p className="text-xs font-medium text-grayscale-500 mb-1">
                    {m['hcp.connect.howLongLabel']()}
                </p>
                <p className="text-sm text-grayscale-900">{durationText(request.duration)}</p>
            </div>
        </section>
        <p className="text-xs text-grayscale-500">{m['hcp.connect.stopAnytime']()}</p>
        <p className="text-xs text-grayscale-500">{m['hcp.connect.unverified']()}</p>
        {failed && (
            <div
                role="alert"
                className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700"
            >
                {m['hcp.error.allow']()}
            </div>
        )}
        <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={onAllow}
                disabled={pending}
                className="w-full py-3 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium disabled:opacity-50"
            >
                {pending ? (
                    <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        {m['hcp.connect.allowing']()}
                    </span>
                ) : (
                    m['hcp.connect.allow']()
                )}
            </button>
            <button
                type="button"
                onClick={onDeny}
                disabled={pending}
                className="w-full py-3 rounded-[20px] border border-grayscale-300 text-sm text-grayscale-700"
            >
                {m['hcp.connect.deny']()}
            </button>
        </div>
    </div>
);

export default ConsentScreen;
