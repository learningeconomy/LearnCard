import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';

import * as m from '../../../paraglide/messages.js';

import type {
    DashboardDataTrustViewModel,
    DashboardDataTrustProofItem,
} from '../DashboardView.types';

const MAX_PROOF_AVATARS = 4;
const LOTS_THRESHOLD = 5;

const ProofAvatar: React.FC<{ item: DashboardDataTrustProofItem }> = ({ item }) => {
    const [failed, setFailed] = React.useState(false);
    const showImage = Boolean(item.image) && !failed;

    return showImage ? (
        <img
            src={item.image}
            alt={item.name}
            title={item.name}
            onError={() => setFailed(true)}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
        />
    ) : (
        <span
            title={item.name}
            className="w-8 h-8 rounded-full ring-2 ring-white bg-grayscale-100 flex items-center justify-center text-grayscale-400"
        >
            <Shield className="w-4 h-4" />
        </span>
    );
};

const DataTrustCard: React.FC<{ vm: DashboardDataTrustViewModel }> = ({ vm }) => {
    const { places, canRead, canWrite, proof, onManage } = vm;

    const isEmpty = places === 0;
    const isLots = places >= LOTS_THRESHOLD;

    const shownProof = proof.slice(0, MAX_PROOF_AVATARS);
    const overflow = proof.length - shownProof.length;

    const statusText = isEmpty
        ? m['dashboard.dataTrust.emptyStatus']()
        : places === 1
        ? m['dashboard.dataTrust.sharingWithOne']({ count: places })
        : m['dashboard.dataTrust.sharingWithMany']({ count: places });

    const detailText = isEmpty
        ? m['dashboard.dataTrust.emptyDetail']()
        : isLots
        ? canWrite > 0
            ? m['dashboard.dataTrust.detailReadWrite']({ read: canRead, write: canWrite })
            : m['dashboard.dataTrust.detailReadOnly']({ read: canRead })
        : m['dashboard.dataTrust.detailFew']();

    return (
        <button
            type="button"
            onClick={onManage}
            aria-label={m['dashboard.dataTrust.manage']()}
            className="group w-full text-left bg-white rounded-[20px] p-5 desktop:p-6 shadow-soft-bottom border border-grayscale-200 hover:border-grayscale-300 transition-colors animate-fade-in-up"
        >
            <div className="flex items-start gap-4">
                <span
                    aria-hidden
                    className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isEmpty
                            ? 'bg-grayscale-100 text-grayscale-500'
                            : 'bg-emerald-50 text-emerald-600'
                    }`}
                >
                    <Shield className="w-6 h-6" />
                </span>

                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                        {m['dashboard.dataTrust.label']()}
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold text-grayscale-900">
                        {m['dashboard.dataTrust.title']()}
                    </h2>
                    <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                        <span className="font-medium text-grayscale-900">{statusText}</span>{' '}
                        {detailText}
                    </p>

                    {!isEmpty && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <div className="flex -space-x-2">
                                {shownProof.map(item => (
                                    <ProofAvatar key={item.uri} item={item} />
                                ))}
                                {overflow > 0 && (
                                    <span className="w-8 h-8 rounded-full ring-2 ring-white bg-grayscale-100 text-grayscale-600 text-xs font-medium flex items-center justify-center">
                                        +{overflow}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-grayscale-600 group-hover:text-grayscale-900 transition-colors">
                        {m['dashboard.dataTrust.manage']()}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                </div>

                <ChevronRight className="hidden desktop:block shrink-0 w-5 h-5 mt-1 text-grayscale-400 group-hover:text-grayscale-600 transition-colors" />
            </div>
        </button>
    );
};

export default DataTrustCard;
