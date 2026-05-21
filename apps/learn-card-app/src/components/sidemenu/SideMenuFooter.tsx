import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useModal, ModalTypes } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';
import VersionInfoModal from '../versionInfoModal/VersionInfoModal';

const SideMenuFooter: React.FC<{ version?: string | undefined }> = ({ version }) => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.Cancel });

    const openVersionInfo = (): void => {
        if (!version) return;

        newModal(<VersionInfoModal fallbackVersion={version} />, {
            sectionClassName: '!max-w-[420px]',
            cancelButtonTextOverride: t('sidemenu.footer.close', 'Close'),
        });
    };

    return (
        <div className="px-2 bg-transparent h-18 flex-none order-1 self-stretch flex-grow-0 text-white text-xs font-normal font-poppins mt-6 leading-snug m-4 mb-8">
            <p className="text-grayscale-600 text-xs font-notoSans">
                <Trans i18nKey="sidemenu.footer.poweredBy" defaults="Powered by <0>Consent Flow</0>">
                    Powered by <span className="font-semibold">Consent Flow</span>
                </Trans>
                <br />
                {t('sidemenu.footer.ownYourData', 'You own your own data.')}
                <br />
                <Trans i18nKey="sidemenu.footer.connectionsEncrypted" defaults="All connections are <0>encrypted.</0>">
                    All connections are{' '}
                    <span className={`font-bold text-${primaryColor}`}>encrypted.</span>
                </Trans>
            </p>

            <p className="mt-4">
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openPP}>
                    {t('sidemenu.footer.privacyPolicy', 'Privacy Policy')}
                </button>{' '}
                <span className={`text-${primaryColor}`}> • </span>{' '}
                <button className={`text-${primaryColor} font-bold no-underline`} onClick={openToS}>
                    {t('sidemenu.footer.termsOfService', 'Terms of Service')}
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
                {t('sidemenu.footer.copyright', '© {{year}} Learning Economy', { year: currentYear })}
            </p>
        </div>
    );
};

export default SideMenuFooter;
