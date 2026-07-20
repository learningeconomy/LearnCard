import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

import * as m from '../../../paraglide/messages.js';

type MinorProtectionCardProps = {
    brandName: string;
    delay?: number;
};

const MinorProtectionCard: React.FC<MinorProtectionCardProps> = ({ brandName, delay = 0 }) => {
    const protections = [
        m['dataShareCenter.minor.aiOff'](),
        m['dataShareCenter.minor.noTracking'](),
        m['dataShareCenter.minor.youChoose'](),
    ];

    return (
        <section
            className="relative overflow-hidden rounded-[20px] p-5 desktop:p-6 animate-fade-in-up border border-sky-200/70 ring-1 ring-sky-900/[0.04] shadow-[0_8px_30px_rgba(24,34,78,0.08)] bg-gradient-to-br from-sky-50 via-white/90 to-white/90 backdrop-blur-xl"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <div className="flex items-start gap-4">
                <span
                    aria-hidden
                    className="shrink-0 w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center"
                >
                    <ShieldCheck className="w-6 h-6" />
                </span>

                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium tracking-wider text-sky-600 uppercase">
                        {m['dataShareCenter.minor.eyebrow']()}
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold text-grayscale-900 leading-tight">
                        {m['dataShareCenter.minor.title']()}
                    </h2>
                    <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                        {m['dataShareCenter.minor.subtitle']({ brand: brandName })}
                    </p>

                    <ul className="mt-3 flex flex-col gap-1.5">
                        {protections.map(item => (
                            <li
                                key={item}
                                className="flex items-center gap-2 text-sm text-grayscale-700"
                            >
                                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default MinorProtectionCard;
