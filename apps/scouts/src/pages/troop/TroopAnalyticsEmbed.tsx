import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useWallet from 'learn-card-base/hooks/useWallet';
import { VC } from '@learncard/types';
import { DASHBOARD_TYPE } from 'packages/plugins/lca-api-plugin/src/types';
import { Capacitor } from '@capacitor/core';

export interface AnalyticsPayload {
    resource: {
        dashboardType: DASHBOARD_TYPE;
    };
    params: {
        nso?: string[];
        troop?: string[];
        nso_id?: string[];
        troop_id?: string[];
    };
    exp: number;
}

export interface TroopAnalyticsEmbedProps {
    handleClose: () => void;
    analyticsLevel?: DASHBOARD_TYPE;
    credential: VC;
    boostUri?: string;
}

const METABASE_SITE_URL = 'https://learning-economy-studios.metabaseapp.com';
const TEN_MINUTES_S = 60 * 10;

/** Extract the UUID after `boost:`. Returns `null` if none found. */
const extractUUIDFromBoostId = (id?: string | null) => {
    if (!id) return null;
    const match = id.match(/boost:([0-9a-f-]{36})$/i);
    return match?.[1] ?? null;
};

//TODO move main logic into react query function
const TroopAnalyticsEmbed: React.FC<TroopAnalyticsEmbedProps> = ({
    handleClose,
    analyticsLevel = DASHBOARD_TYPE.GLOBAL,
    credential,
    boostUri,
}) => {
    const { initWallet } = useWallet();
    const [analyticsToken, setAnalyticsToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const buildPayload = useCallback((): AnalyticsPayload | null => {
        const exp = Math.round(Date.now() / 1000) + TEN_MINUTES_S;

        switch (analyticsLevel) {
            case DASHBOARD_TYPE.TROOP: {
                const troopId = extractUUIDFromBoostId(credential?.boostId || boostUri);
                if (!troopId) return null;
                return {
                    resource: { dashboardType: DASHBOARD_TYPE.TROOP },
                    params: { troop_id: [troopId] },
                    exp,
                };
            }

            case DASHBOARD_TYPE.NSO: {
                const nsoId = extractUUIDFromBoostId(credential?.boostId || boostUri);
                if (!nsoId) return null;
                return {
                    resource: { dashboardType: DASHBOARD_TYPE.NSO },
                    params: { nso_id: [nsoId] },
                    exp,
                };
            }

            case DASHBOARD_TYPE.GLOBAL:
            default:
                return {
                    resource: { dashboardType: DASHBOARD_TYPE.GLOBAL },
                    params: {},
                    exp,
                };
        }
    }, [analyticsLevel, credential?.boostId, boostUri, extractUUIDFromBoostId]);

    useEffect(() => {
        (async () => {
            try {
                const wallet = await initWallet();
                const payload = buildPayload();

                if (!payload) throw new Error('Could not construct analytics payload');

                const token = await wallet.invoke.generateAnalyticsAccessToken(payload);
                setAnalyticsToken(token);
            } catch (err) {
                console.error(err);

                setError('Failed to load analytics');
            }
        })();
    }, [buildPayload, initWallet]);

    const iframeUrl = useMemo(
        () =>
            analyticsToken
                ? `${METABASE_SITE_URL}/embed/dashboard/${analyticsToken}#bordered=true&titled=true`
                : null,
        [analyticsToken]
    );

    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        return (
            <section className="flex flex-col w-full h-full bg-white">
                <button
                    type="button"
                    className="self-end m-4 px-4 py-2 rounded bg-grayscale-300 hover:bg-grayscale-400"
                    onClick={handleClose}
                >
                    Close Analytics
                </button>
                <p className="text-center text-red-500 flex-grow flex items-center justify-center">
                    Analytics is only supported on desktop devices. Please view this from a desktop
                    browser.
                </p>
            </section>
        );
    }

    return (
        <section className="flex flex-col w-full h-full bg-white">
            <button
                type="button"
                className="self-end m-4 px-4 py-2 rounded bg-grayscale-300 hover:bg-grayscale-400"
                onClick={handleClose}
            >
                Close Analytics
            </button>

            {error && (
                <p className="text-center text-red-500 flex-grow flex items-center justify-center">
                    {error}
                </p>
            )}

            {!error && !iframeUrl && (
                <p className="text-center flex-grow flex items-center justify-center">Loading…</p>
            )}

            {!error && iframeUrl && (
                <iframe
                    key={iframeUrl} // reloads iframe when token updates
                    src={iframeUrl}
                    title="Analytics Dashboard"
                    frameBorder={0}
                    width="100%"
                    height="100%"
                />
            )}
        </section>
    );
};

export default TroopAnalyticsEmbed;
