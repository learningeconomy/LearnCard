import React from 'react';
import { useModal, ModalTypes } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';
import VersionInfoModal from '../versionInfoModal/VersionInfoModal';

const SideMenuFooter: React.FC<{ version?: string | undefined }> = ({ version }) => {
    const currentYear = new Date().getFullYear();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.Cancel });

    const openVersionInfo = (): void => {
        if (!version) return;

        newModal(<VersionInfoModal fallbackVersion={version} />, {
            sectionClassName: '!max-w-[420px]',
            cancelButtonTextOverride: 'Close',
        });
    };

    return (
        <div className="px-2 bg-transparent h-18 flex-none order-1 self-stretch flex-grow-0 text-white text-xs font-normal font-poppins mt-6 leading-snug m-4 mb-8">
            <p className="text-grayscale-600 text-xs font-notoSans">
                Powered by <span className="font-semibold">Consent Flow</span>
                <br />
                You own your own data.
                <br />
                All connections are{' '}
                <span className={`font-bold text-${primaryColor}`}>encrypted.</span>
            </p>

            <p className="mt-4">
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openPP}>
                    Privacy Policy
                </button>{' '}
                <span className={`text-${primaryColor}`}> • </span>{' '}
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openToS}>
                    Terms of Service
                </button>
            </p>

            <p className="text-grayscale-600 text-xs font-notoSans mt-4">
                {version ? (
                    <>
                        <button
                            type="button"
                            onClick={openVersionInfo}
                            aria-label="View version details"
                            className="text-grayscale-600 hover:text-grayscale-900 transition-colors underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
                        >
                            V {version}
                        </button>
                        <br />
                    </>
                ) : null}
                &copy; {currentYear} Learning Economy
            </p>
        </div>
    );
};

export default SideMenuFooter;
