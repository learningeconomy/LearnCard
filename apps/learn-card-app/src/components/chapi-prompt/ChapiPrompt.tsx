import React from 'react';
import { ChevronLeft } from 'lucide-react';

import PigeonMail from '../../assets/images/pigeon-mail.png';
import HandshakeIcon from '../svgs/HandshakeIcon';

import { useWallet, getLogger } from 'learn-card-base';
import { ToastTypeEnum, useToast } from 'learn-card-base/hooks/useToast';
import { openExternalLink } from '../../helpers/externalLinkHelpers';

import useTheme from '../../theme/hooks/useTheme';
import * as m from '../../paraglide/messages.js';

const log = getLogger('chapi-prompt');

export const CHAPI_ABOUT_LINK = 'https://chapi.io/';

type ChapiPromptProps = {
    onBack: () => void;
};

export const ChapiPrompt: React.FC<ChapiPromptProps> = ({ onBack }) => {
    const { installChapi } = useWallet();
    const { presentToast } = useToast();

    const { getColorSet } = useTheme();
    const primaryColor = getColorSet('defaults')?.primary || '#4f46e5';

    const handleConnectChapi = async () => {
        try {
            await installChapi();
            presentToast(m['chapi.connected'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            log.info('installChapi::error', e);
            presentToast(m['chapi.connFail'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <section className="h-full flex flex-col bg-white">
            {/* Top Bar */}
            <div
                className="shrink-0 flex items-center px-4 py-3 border-b border-grayscale-100 safe-area-top-margin"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
            >
                <button
                    onClick={onBack}
                    className="flex items-center text-grayscale-600 hover:text-grayscale-900 transition-colors font-poppins font-medium"
                >
                    <ChevronLeft className="w-6 h-6 mr-1" />
                    {m['chapi.back']()}
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="pt-10 pb-8 px-6 flex flex-col items-center max-w-[500px] mx-auto">
                    <div className="w-24 h-24 mb-6 rounded-full bg-emerald-50 flex items-center justify-center shadow-inner">
                        <img
                            src={PigeonMail}
                            alt="chapi logo"
                            className="w-16 h-16 object-contain"
                        />
                    </div>

                    <h4 className="text-2xl font-bold text-grayscale-900 font-poppins mb-4 text-center">
                        {m['chapi.title']()}
                    </h4>

                    <div className="text-center space-y-4 text-[15px] text-grayscale-600 leading-relaxed mb-8">
                        <p>{m['chapi.p1']()}</p>
                        <p>{m['chapi.p2']()}</p>
                        <p>{m['chapi.p3']()}</p>
                    </div>

                    <button
                        onClick={() => openExternalLink(CHAPI_ABOUT_LINK)}
                        className="text-[15px] font-medium hover:opacity-80 transition-opacity mb-8"
                        style={{ color: primaryColor }}
                    >
                        {m['chapi.readMore']()}
                    </button>
                </div>
            </div>

            {/* Bottom Action Area */}
            <div
                className="shrink-0 px-6 py-4 border-t border-grayscale-100 bg-white"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
            >
                <div className="max-w-[500px] mx-auto">
                    <button
                        onClick={handleConnectChapi}
                        className="flex items-center justify-center text-white rounded-full px-6 py-3.5 font-poppins font-semibold text-[17px] w-full shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <HandshakeIcon className="mr-2 w-5 h-5" /> {m['chapi.connectHandler']()}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ChapiPrompt;
