import React from 'react';
import { useModal, ModalTypes } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import { renderParts } from '../../i18n';

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
            cancelButtonTextOverride: m['common.close'](),
        });
    };

    return (
        <div className="px-2 bg-transparent h-18 flex-none order-1 self-stretch flex-grow-0 text-white text-xs font-normal font-poppins mt-6 leading-snug m-4 mb-8">
            <p className="text-grayscale-600 text-xs font-notoSans">
                {renderParts(m['sidemenu.footer.poweredBy'].parts(), {
                    '0': <span className="font-semibold" />,
                })}
                <br />
                {m['sidemenu.footer.ownYourData']()}
                <br />
                {renderParts(m['sidemenu.footer.connectionsEncrypted'].parts(), {
                    '0': <span className={`font-bold text-${primaryColor}`} />,
                })}
            </p>

            <p className="mt-4">
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openPP}>
                    {m['sidemenu.footer.privacyPolicy']()}
                </button>{' '}
                <span className={`text-${primaryColor}`}> • </span>{' '}
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openToS}>
                    {m['sidemenu.footer.termsOfService']()}
                </button>
            </p>

            <p className="text-grayscale-600 text-xs font-notoSans mt-4">
                {version ? (
                    <>
                        <button
                            type="button"
                            onClick={openVersionInfo}
                            aria-label="View version details"
                            className="text-grayscale-900 underline transition-colors underline-offset-2 focus:outline-none focus-visible:underline"
                        >
                            V {version}
                        </button>
                        <br />
                    </>
                ) : null}
                {m['sidemenu.footer.copyright']({ year: currentYear })}
            </p>
        </div>
    );
};

export default SideMenuFooter;
