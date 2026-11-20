import React from 'react';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';
import { openPP } from '../../helpers/externalLinkHelpers';

/**
 * Quiet note shown while a user sets the PIN that protects automatic recovery: one
 * encrypted piece of their account key is held by the escrow service, and the PIN
 * unlocks it without the 7-day wait. The link opens the tenant's privacy policy (in-app
 * browser on native). Uses `openPP` rather than `useTenantLinks` so it renders outside
 * a `TenantConfigProvider` too (the overlay mounts from `AuthCoordinatorProvider`).
 */
export const EscrowPinNotice: React.FC = () => (
    <p className="mx-auto max-w-[300px] text-xs text-grayscale-500 leading-relaxed text-center text-balance">
        <TransP
            m={m['recovery.pin.escrowNotice']}
            components={[
                // The invisible ::after widens the tap target to ~40px without moving the text.
                <button
                    key="learn-more"
                    type="button"
                    onClick={() => {
                        void openPP();
                    }}
                    className="relative inline whitespace-nowrap font-medium text-grayscale-700 underline decoration-grayscale-300 underline-offset-2 hover:text-grayscale-900 hover:decoration-grayscale-500 transition-colors rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']"
                />,
            ]}
        />
    </p>
);
