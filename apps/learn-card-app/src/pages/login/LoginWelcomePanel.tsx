import React from 'react';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { useTheme } from '../../theme/hooks/useTheme';

/**
 * Themed branded welcome panel shown on the right side of the desktop
 * login page when the tenant doesn't provide a custom desktop-login-bg image.
 */
const LoginWelcomePanel: React.FC = () => {
    const brandingConfig = useBrandingConfig();
    const { brandMarkLight, fullLogoDark } = useTenantBrandingAssets();
    const { theme } = useTheme();

    const loaderColors = theme.colors.defaults.loaders ?? [];
    const baseColor = theme.colors.defaults.loginBgColor ?? loaderColors[0] ?? '#059669';
    const accentColor = loaderColors[1] ?? loaderColors[0] ?? '#06B6D4';

    return (
        <div
            className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
            style={{ backgroundColor: baseColor }}
        >
            {/* Decorative circles */}
            <div
                className="absolute -top-[15%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-10"
                style={{ backgroundColor: accentColor }}
            />

            <div
                className="absolute -bottom-[10%] -left-[8%] w-[40%] h-[40%] rounded-full opacity-10"
                style={{ backgroundColor: accentColor }}
            />

            <div
                className="absolute top-[20%] left-[15%] w-[20%] h-[20%] rounded-full opacity-[0.06]"
                style={{ backgroundColor: '#fff' }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-12 max-w-[480px] text-center">
                {/* {fullLogoDark ? (
                    <img
                        src={fullLogoDark}
                        alt={brandingConfig.name}
                        className="max-w-[220px] max-h-[120px] object-contain mb-10 drop-shadow-lg"
                    />
                ) : (
                    <img
                        src={brandMarkLight}
                        alt={brandingConfig.name}
                        className="w-[100px] h-[100px] object-contain mb-10 drop-shadow-lg"
                    />
                )} */}

                <h2 className="text-white text-3xl font-semibold mb-4 leading-snug drop-shadow-sm">
                    Welcome to {brandingConfig.name}
                </h2>

                <p className="text-white/70 text-base leading-relaxed max-w-[340px]">
                    Sign in to access your credentials, achievements, and more.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                    {['Credentials', 'Achievements', 'Skills'].map(label => (
                        <span
                            key={label}
                            className="px-4 py-2 rounded-full text-sm font-medium text-white/90 bg-white/10 backdrop-blur-sm"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoginWelcomePanel;
