import React from 'react';
import { useModal, ModalTypes } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';
import VersionInfoModal from '../versionInfoModal/VersionInfoModal';
import useLogout from '../../hooks/useLogout';

import * as m from '../../paraglide/messages.js';

const SideMenuFooter: React.FC<{ version?: string | undefined }> = ({ version }) => {
    const currentYear = new Date().getFullYear();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.Cancel });

    const { handleLogout, isLoggingOut } = useLogout();

    const openVersionInfo = (): void => {
        if (!version) return;

        newModal(<VersionInfoModal fallbackVersion={version} />, {
            sectionClassName: '!max-w-[420px]',
            cancelButtonTextOverride: m['common.close'](),
        });
    };

    return (
        <div className="w-full px-4 pt-[10px] pb-8 flex flex-col items-start text-left font-poppins">
            <p className="text-[13px] font-bold">
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openPP}>
                    {m['sidemenu.footer.privacy']()}
                </button>
                <span className="text-grayscale-600"> • </span>
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openToS}>
                    {m['sidemenu.footer.terms']()}
                </button>
                <span className="text-grayscale-600"> • </span>
                <button
                    type="button"
                    className={`text-${primaryColor} font-bold no-underline disabled:opacity-60`}
                    onClick={() => handleLogout()}
                    disabled={isLoggingOut}
                >
                    {m['sidemenu.footer.logout']()}
                </button>
            </p>

            <p className="mt-[10px] text-[13px] text-grayscale-600">
                {version ? (
                    <button
                        type="button"
                        onClick={openVersionInfo}
                        aria-label={m['sidemenu.footer.viewVersionDetails']()}
                        className="text-grayscale-600 transition-colors focus:outline-none focus-visible:underline"
                    >
                        V {version}
                    </button>
                ) : null}
            </p>
            <p className="text-[13px] text-grayscale-500">&copy; {currentYear} Learning Economy</p>
        </div>
    );
};

export default SideMenuFooter;
