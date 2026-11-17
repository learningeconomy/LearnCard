import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

import * as m from '../../paraglide/messages.js';

export const HcpLoading: React.FC = () => (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10">
        <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-900 rounded-full animate-spin" />
        <span className="text-sm text-grayscale-600">{m['common.loading']()}</span>
    </div>
);

export const HcpError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
        <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
        <div className="flex-1">
            <p className="text-sm font-medium text-red-700">{m['hcp.error.title']()}</p>
            <p className="text-sm text-red-700 leading-relaxed">{m['hcp.error.body']()}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-sm font-medium text-red-700 underline"
            >
                {m['common.tryAgain']()}
            </button>
        </div>
    </div>
);

export const HcpEmpty: React.FC<{ title: string; body: string }> = ({ title, body }) => (
    <div className="py-10 px-6 text-center">
        <p className="text-[15px] font-semibold text-grayscale-900 mb-1">{title}</p>
        <p className="text-sm text-grayscale-600">{body}</p>
    </div>
);

export const Spinner: React.FC = () => (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

export const formatWhen = (iso: string): string =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(iso)
    );
