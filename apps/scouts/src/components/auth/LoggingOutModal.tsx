import React from 'react';
import { ScoutsLogo } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';

const LOGOUT_SPINNER_CSS = `
    .app-spinner {
        --stroke-width: 2px !important;
    }
    .app-spinner svg, .app-spinner circle {
        stroke-width: 2px !important;
    }
`;

const LoggingOutModal: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[40px] w-full max-w-[340px] shadow-2xl border border-gray-50">
            <div className="relative flex items-center justify-center mb-10">
                <style>{LOGOUT_SPINNER_CSS}</style>
                <AppSpinner name="crescent" className="w-28 h-28 text-sp-purple-base" />
                <ScoutsLogo className="w-14 h-14 absolute" />
            </div>
            <div className="font-rubik text-grayscale-900 font-medium text-xl text-center">
                {m['auth.loggingOut']()}
            </div>
        </div>
    );
};

export default LoggingOutModal;
