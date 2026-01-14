import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Lock, Sparkles, Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * BETA GATE - Easy to remove later!
 * 
 * To remove beta gating:
 * 1. Remove <BetaGate> wrapper from DeveloperPortalRoutes.tsx
 * 2. Remove useBetaAccess() checks from GuidePage.tsx and IntegrationHub.tsx
 * 3. Delete this file
 * 
 * That's it!
 */

// All available guide IDs
type GuideId = 'course-catalog' | 'issue-credentials' | 'verify-credentials' | 'consent-flow' | 'embed-claim' | 'embed-app' | 'server-webhooks';

// Beta access codes - these are PUBLIC promotional codes, not secrets.
// They are used for controlled rollout of features, not security.
// BETA-2026 = full access to everything
// GUIDE_* = access to specific guide only
const BETA_ACCESS_CODES: Record<string, GuideId[] | 'full'> = {
    'BETA-2026': 'full',
    'GUIDE_COURSE': ['course-catalog'],
    'GUIDE_ISSUE': ['issue-credentials'],
    'GUIDE_VERIFY': ['verify-credentials'],
    'GUIDE_CONSENT': ['consent-flow'],
    'GUIDE_EMBED': ['embed-claim'],
    'GUIDE_APP': ['embed-app'],
    'GUIDE_WEBHOOKS': ['server-webhooks'],
};

const STORAGE_KEY = 'lc_beta_access';
const WELCOME_SHOWN_KEY = 'lc_beta_welcome_shown';

interface BetaGateContextValue {
    hasAccess: boolean;
    isGuideUnlocked: (guideId: string) => boolean;
    unlockedGuides: string[];
    clearAccess: () => void;
}

const BetaGateContext = createContext<BetaGateContextValue>({
    hasAccess: false,
    isGuideUnlocked: () => false,
    unlockedGuides: [],
    clearAccess: () => {},
});

export const useBetaAccess = () => useContext(BetaGateContext);

interface BetaGateProps {
    children: React.ReactNode;
}

export const BetaGate: React.FC<BetaGateProps> = ({ children }) => {
    const location = useLocation();
    const history = useHistory();

    const [storedSecret, setStoredSecret] = useState<string | null>(() => {
        return localStorage.getItem(STORAGE_KEY);
    });

    const [welcomeShown, setWelcomeShown] = useState(() => {
        return localStorage.getItem(WELCOME_SHOWN_KEY) === 'true';
    });

    const [showWelcome, setShowWelcome] = useState(false);
    const [showPasswordEntry, setShowPasswordEntry] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Derive access from stored secret
    const accessConfig = storedSecret ? BETA_ACCESS_CODES[storedSecret] : null;
    const hasAccess = accessConfig !== null && accessConfig !== undefined;

    const unlockedGuides: string[] = React.useMemo(() => {
        if (!accessConfig) return [];
        if (accessConfig === 'full') {
            return Object.keys(BETA_ACCESS_CODES)
                .filter(k => k.startsWith('GUIDE_'))
                .flatMap(k => BETA_ACCESS_CODES[k] as string[]);
        }
        return accessConfig;
    }, [accessConfig]);

    const isGuideUnlocked = (guideId: string): boolean => {
        if (!hasAccess) return false;
        if (accessConfig === 'full') return true;
        return (accessConfig as string[]).includes(guideId);
    };

    // Check for beta_access query param on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const betaAccess = params.get('beta_access');

        if (betaAccess && BETA_ACCESS_CODES[betaAccess]) {
            // Valid secret in URL - store it
            localStorage.setItem(STORAGE_KEY, betaAccess);
            setStoredSecret(betaAccess);

            // Remove the query param from URL for cleanliness
            params.delete('beta_access');
            const newSearch = params.toString();
            history.replace({
                pathname: location.pathname,
                search: newSearch ? `?${newSearch}` : '',
            });

            // Show welcome if not shown before
            if (localStorage.getItem(WELCOME_SHOWN_KEY) !== 'true') {
                setShowWelcome(true);
            }
        } else if (storedSecret && BETA_ACCESS_CODES[storedSecret]) {
            // Has valid stored access
            if (!welcomeShown) {
                setShowWelcome(true);
            }
        } else {
            // No access - show password entry
            setShowPasswordEntry(true);
        }
    }, []);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmedPassword = password.trim().toUpperCase();

        if (BETA_ACCESS_CODES[trimmedPassword]) {
            localStorage.setItem(STORAGE_KEY, trimmedPassword);
            setStoredSecret(trimmedPassword);
            setShowPasswordEntry(false);
            setShowWelcome(true);
            setPassword('');
        } else {
            setError('Invalid access code. Please check and try again.');
        }
    };

    const handleWelcomeDismiss = () => {
        localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
        setWelcomeShown(true);
        setShowWelcome(false);
    };

    const clearAccess = () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(WELCOME_SHOWN_KEY);
        setStoredSecret(null);
        setWelcomeShown(false);
        setShowPasswordEntry(true);
    };

    const contextValue: BetaGateContextValue = {
        hasAccess,
        isGuideUnlocked,
        unlockedGuides,
        clearAccess,
    };

    // Password entry screen
    if (showPasswordEntry) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-cyan-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Beta Access Required
                        </h1>

                        <p className="text-gray-500">
                            This feature is currently in beta. Enter your access code to continue.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="beta-password" className="block text-sm font-medium text-gray-700 mb-2">
                                Access Code
                            </label>

                            <input
                                id="beta-password"
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your beta access code"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
                                autoFocus
                                autoComplete="off"
                            />

                            {error && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-600 transition-colors"
                        >
                            Continue
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        Don't have an access code?{' '}
                        <a href="mailto:support@learncard.com" className="text-cyan-600 hover:underline">
                            Contact us
                        </a>
                    </p>

                    <button
                        onClick={() => history.push('/app-store/developer')}
                        className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Back to Developer Portal
                    </button>
                </div>
            </div>
        );
    }

    // Welcome message overlay
    if (showWelcome) {
        const isFull = accessConfig === 'full';
        const guideNames: Record<string, string> = {
            'course-catalog': 'Course Catalog',
            'issue-credentials': 'Issue Credentials',
            'verify-credentials': 'Verify Credentials',
            'consent-flow': 'Consent Flow',
            'embed-claim': 'Embed Claim',
            'embed-app': 'Embed App',
            'server-webhooks': 'Server Webhooks',
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome to the Beta!
                        </h1>

                        <p className="text-gray-500">
                            You're previewing new developer tools before they're publicly available.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                            <div className="text-sm">
                                <p className="font-medium text-amber-800 mb-1">Beta Preview Notice</p>

                                <p className="text-amber-700">
                                    This is pre-release functionality. Features may change, and you may encounter bugs.
                                    Your feedback is valuable!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <p className="text-sm font-medium text-gray-700">Your access includes:</p>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />

                            <span className="text-gray-700">Integration dashboard</span>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />

                            <span className="text-gray-700">API token management</span>
                        </div>

                        {isFull ? (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />

                                <span className="text-gray-700">All integration guides</span>
                            </div>
                        ) : (
                            <>
                                {(accessConfig as string[]).map(guideId => (
                                    <div key={guideId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />

                                        <span className="text-gray-700">{guideNames[guideId] || guideId} guide</span>
                                    </div>
                                ))}

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />

                                    <span className="text-gray-500">Other guides (locked)</span>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleWelcomeDismiss}
                        className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Rocket className="w-5 h-5" />
                        Let's Go!
                    </button>

                    <p className="mt-4 text-center text-xs text-gray-400">
                        Questions or feedback?{' '}
                        <a href="mailto:support@learncard.com" className="text-cyan-600 hover:underline">
                            support@learncard.com
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    // Normal content with context
    return (
        <BetaGateContext.Provider value={contextValue}>
            {children}
        </BetaGateContext.Provider>
    );
};

// Component to show locked state for a guide
export const LockedGuideOverlay: React.FC<{ guideName: string }> = ({ guideName }) => {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-gray-400" />
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {guideName}
                </h2>

                <p className="text-gray-500 mb-6">
                    This guide is not available with your current beta access.
                    Contact us to request expanded access.
                </p>

                <a
                    href="mailto:support@learncard.com?subject=Beta Access Request"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    Request Access
                </a>
            </div>
        </div>
    );
};

export default BetaGate;
