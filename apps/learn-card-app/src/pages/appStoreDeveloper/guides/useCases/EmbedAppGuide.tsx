import React, { useState, useCallback } from 'react';
import { 
    Globe, 
    Package, 
    Code, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
    Plus,
    FolderOpen,
    Sparkles,
    Terminal,
    FileCode,
    Layers,
    Loader2,
    XCircle,
    AlertCircle,
    Search,
    Lock,
    Shield,
    Monitor,
} from 'lucide-react';

import { StepProgress, CodeOutputPanel } from '../shared';
import { useGuideState } from '../shared/useGuideState';

// URL Check types and helper
interface UrlCheckResult {
    id: string;
    label: string;
    status: 'pending' | 'checking' | 'pass' | 'fail' | 'warn';
    message?: string;
}

const checkUrl = async (url: string): Promise<UrlCheckResult[]> => {
    const results: UrlCheckResult[] = [
        { id: 'https', label: 'HTTPS', status: 'pending' },
        { id: 'reachable', label: 'Reachable', status: 'pending' },
        { id: 'cors', label: 'CORS Headers', status: 'pending' },
    ];

    // Check 1: HTTPS
    try {
        const parsed = new URL(url);

        if (parsed.protocol === 'https:') {
            results[0] = { ...results[0], status: 'pass', message: 'Using secure HTTPS' };
        } else if (parsed.protocol === 'http:') {
            if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
                results[0] = { ...results[0], status: 'warn', message: 'HTTP allowed for localhost' };
            } else {
                results[0] = { ...results[0], status: 'fail', message: 'HTTPS required for production' };
            }
        } else {
            results[0] = { ...results[0], status: 'fail', message: 'Invalid protocol' };
        }
    } catch {
        results[0] = { ...results[0], status: 'fail', message: 'Invalid URL format' };
        results[1] = { ...results[1], status: 'fail', message: 'Cannot check - invalid URL' };
        results[2] = { ...results[2], status: 'fail', message: 'Cannot check - invalid URL' };
        return results;
    }

    // Check 2 & 3: Reachability and CORS
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'cors',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Reachable
        results[1] = { ...results[1], status: 'pass', message: `Status ${response.status}` };

        // Check CORS headers
        const corsHeader = response.headers.get('Access-Control-Allow-Origin');

        if (corsHeader === '*' || corsHeader) {
            results[2] = { ...results[2], status: 'pass', message: `CORS: ${corsHeader}` };
        } else {
            results[2] = { ...results[2], status: 'warn', message: 'CORS header not visible (may still work)' };
        }
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            // CORS block or network error
            results[1] = { ...results[1], status: 'warn', message: 'Blocked by CORS or unreachable' };
            results[2] = { ...results[2], status: 'fail', message: 'CORS not configured or blocking' };
        } else if (err instanceof DOMException && err.name === 'AbortError') {
            results[1] = { ...results[1], status: 'fail', message: 'Request timed out (10s)' };
            results[2] = { ...results[2], status: 'pending', message: 'Could not check' };
        } else {
            results[1] = { ...results[1], status: 'fail', message: 'Network error' };
            results[2] = { ...results[2], status: 'pending', message: 'Could not check' };
        }
    }

    return results;
};

// URL Check Results Component
const UrlCheckResults: React.FC<{ results: UrlCheckResult[]; isChecking: boolean }> = ({ results, isChecking }) => {
    const getIcon = (status: UrlCheckResult['status']) => {
        switch (status) {
            case 'checking':
                return <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />;
            case 'pass':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'fail':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'warn':
                return <AlertCircle className="w-4 h-4 text-amber-500" />;
            default:
                return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
        }
    };

    const getCheckIcon = (id: string) => {
        switch (id) {
            case 'https':
                return <Lock className="w-4 h-4 text-gray-400" />;
            case 'reachable':
                return <Monitor className="w-4 h-4 text-gray-400" />;
            case 'cors':
                return <Shield className="w-4 h-4 text-gray-400" />;
            default:
                return null;
        }
    };

    const allPassed = results.every(r => r.status === 'pass' || r.status === 'warn');
    const hasFailed = results.some(r => r.status === 'fail');

    return (
        <div className={`p-4 rounded-xl border ${
            isChecking ? 'bg-gray-50 border-gray-200' :
            allPassed ? 'bg-emerald-50 border-emerald-200' :
            hasFailed ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
        }`}>
            <div className="flex items-center gap-2 mb-3">
                {isChecking ? (
                    <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                ) : allPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : hasFailed ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                )}

                <h4 className={`font-medium ${
                    isChecking ? 'text-gray-700' :
                    allPassed ? 'text-emerald-800' :
                    hasFailed ? 'text-red-800' :
                    'text-gray-700'
                }`}>
                    {isChecking ? 'Checking your URL...' :
                     allPassed ? 'Looking good!' :
                     hasFailed ? 'Some issues found' :
                     'URL Check Results'}
                </h4>
            </div>

            <div className="space-y-2">
                {results.map(result => (
                    <div key={result.id} className="flex items-center gap-3">
                        {getCheckIcon(result.id)}

                        <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{result.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {result.message && (
                                <span className={`text-xs ${
                                    result.status === 'pass' ? 'text-emerald-600' :
                                    result.status === 'fail' ? 'text-red-600' :
                                    result.status === 'warn' ? 'text-amber-600' :
                                    'text-gray-500'
                                }`}>
                                    {result.message}
                                </span>
                            )}

                            {getIcon(isChecking && result.status === 'pending' ? 'checking' : result.status)}
                        </div>
                    </div>
                ))}
            </div>

            {!isChecking && hasFailed && (
                <p className="mt-3 text-xs text-red-600">
                    Fix the issues above before continuing. See the header examples below.
                </p>
            )}

            {!isChecking && allPassed && (
                <p className="mt-3 text-xs text-emerald-600">
                    Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).
                </p>
            )}
        </div>
    );
};

type AppType = 'existing' | 'new' | null;

const STEPS = [
    { id: 'choose-path', title: 'Choose Path' },
    { id: 'setup-website', title: 'Set Up Website' },
    { id: 'install-sdk', title: 'Install SDK' },
    { id: 'initialize', title: 'Initialize' },
    { id: 'use-api', title: 'Use the API' },
];

// Step 0: Choose Path
const ChoosePathStep: React.FC<{
    onComplete: (appType: AppType) => void;
    appType: AppType;
    setAppType: (type: AppType) => void;
}> = ({ onComplete, appType, setAppType }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">What are you building?</h3>

                <p className="text-gray-600">
                    Your app will run inside an iframe in the LearnCard wallet. Let's figure out the best approach for you.
                </p>
            </div>

            {/* Path options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Existing App */}
                <button
                    onClick={() => setAppType('existing')}
                    className={`flex flex-col items-start p-5 border-2 rounded-2xl text-left transition-all ${
                        appType === 'existing'
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        appType === 'existing' ? 'bg-cyan-100' : 'bg-gray-100'
                    }`}>
                        <FolderOpen className={`w-6 h-6 ${appType === 'existing' ? 'text-cyan-600' : 'text-gray-500'}`} />
                    </div>

                    <h4 className="font-semibold text-gray-800 mb-1">I have an existing app</h4>

                    <p className="text-sm text-gray-600 mb-3">
                        Embed a web app you've already built into LearnCard
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">React</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">Vue</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">Next.js</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">Any</span>
                    </div>
                </button>

                {/* New App */}
                <button
                    onClick={() => setAppType('new')}
                    className={`flex flex-col items-start p-5 border-2 rounded-2xl text-left transition-all ${
                        appType === 'new'
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        appType === 'new' ? 'bg-violet-100' : 'bg-gray-100'
                    }`}>
                        <Plus className={`w-6 h-6 ${appType === 'new' ? 'text-violet-600' : 'text-gray-500'}`} />
                    </div>

                    <h4 className="font-semibold text-gray-800 mb-1">Start from scratch</h4>

                    <p className="text-sm text-gray-600 mb-3">
                        Create a new app using our templates and starters
                    </p>

                    <div className="flex items-center gap-1.5 mt-auto">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs text-violet-600 font-medium">Quickest path</span>
                    </div>
                </button>
            </div>

            {/* Conditional guidance based on selection */}
            {appType === 'existing' && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <h4 className="font-medium text-cyan-800 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Great choice!
                    </h4>

                    <p className="text-sm text-cyan-700 mb-3">
                        You'll need to configure your server headers to allow iframe embedding, then add our SDK.
                    </p>

                    <div className="text-sm text-cyan-800">
                        <strong>Checklist for your existing app:</strong>
                        <ul className="mt-2 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-500 mt-0.5">•</span>
                                <span>Hosted on HTTPS (required for iframes)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-500 mt-0.5">•</span>
                                <span>Can modify server response headers</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-500 mt-0.5">•</span>
                                <span>Uses a JavaScript bundler (npm/yarn/pnpm)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {appType === 'new' && (
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                    <h4 className="font-medium text-violet-800 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Let's get you started!
                    </h4>

                    <p className="text-sm text-violet-700 mb-3">
                        We'll help you create a new app from a template with everything pre-configured.
                    </p>

                    <div className="text-sm text-violet-800">
                        <strong>You'll get:</strong>
                        <ul className="mt-2 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-violet-500 mt-0.5">•</span>
                                <span>Pre-configured iframe headers</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-violet-500 mt-0.5">•</span>
                                <span>Partner Connect SDK already installed</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-violet-500 mt-0.5">•</span>
                                <span>Example code for SSO and credentials</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Continue */}
            <button
                onClick={() => appType && onComplete(appType)}
                disabled={!appType}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Continue
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

// Step 1: Setup Website
const SetupWebsiteStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    appUrl: string;
    setAppUrl: (url: string) => void;
    appType: AppType;
    selectedFramework: string;
    setSelectedFramework: (framework: string) => void;
}> = ({ onComplete, onBack, appUrl, setAppUrl, appType, selectedFramework, setSelectedFramework }) => {
    const frameworks = [
        { id: 'react', name: 'React', icon: '⚛️', cmd: 'npx create-react-app my-learncard-app' },
        { id: 'next', name: 'Next.js', icon: '▲', cmd: 'npx create-next-app@latest my-learncard-app' },
        { id: 'vite', name: 'Vite', icon: '⚡', cmd: 'npm create vite@latest my-learncard-app' },
        { id: 'vue', name: 'Vue', icon: '💚', cmd: 'npm create vue@latest my-learncard-app' },
    ];

    // New app path
    if (appType === 'new') {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Your App</h3>

                    <p className="text-gray-600">
                        Choose a framework and we'll give you the commands to get started with a pre-configured setup.
                    </p>
                </div>

                {/* Framework selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose a framework</label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {frameworks.map(fw => (
                            <button
                                key={fw.id}
                                onClick={() => setSelectedFramework(fw.id)}
                                className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                                    selectedFramework === fw.id
                                        ? 'border-violet-500 bg-violet-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <span className="text-2xl mb-1">{fw.icon}</span>
                                <span className="text-sm font-medium text-gray-800">{fw.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Commands based on selection */}
                {selectedFramework && (
                    <div className="space-y-4">
                        <CodeOutputPanel
                            title="1. Create your project"
                            snippets={{
                                typescript: `# Create a new ${frameworks.find(f => f.id === selectedFramework)?.name} project
${frameworks.find(f => f.id === selectedFramework)?.cmd}

cd my-learncard-app`,
                            }}
                        />

                        <CodeOutputPanel
                            title="2. Install Partner Connect SDK"
                            snippets={{
                                typescript: `npm install @learncard/partner-connect`,
                            }}
                        />

                        {selectedFramework === 'next' && (
                            <CodeOutputPanel
                                title="3. Configure headers (next.config.js)"
                                snippets={{
                                    typescript: `/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'ALLOWALL' },
                    { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;`,
                                }}
                            />
                        )}

                        {selectedFramework === 'vite' && (
                            <CodeOutputPanel
                                title="3. Configure headers (vite.config.ts)"
                                snippets={{
                                    typescript: `import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        headers: {
            'X-Frame-Options': 'ALLOWALL',
            'Content-Security-Policy': 'frame-ancestors *',
        },
    },
});`,
                                }}
                            />
                        )}

                        {(selectedFramework === 'react' || selectedFramework === 'vue') && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <h4 className="font-medium text-amber-800 mb-2">Configure headers on your server</h4>

                                <p className="text-sm text-amber-700">
                                    When you deploy, you'll need to configure your hosting provider to add these headers.
                                    Most providers (Vercel, Netlify, etc.) support this in their config files.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* App name input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Name (for reference)</label>

                    <input
                        type="text"
                        value={appUrl}
                        onChange={(e) => setAppUrl(e.target.value)}
                        placeholder="My LearnCard App"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        onClick={onComplete}
                        disabled={!selectedFramework}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Existing app path - state for URL checking
    const [isChecking, setIsChecking] = useState(false);
    const [checkResults, setCheckResults] = useState<UrlCheckResult[] | null>(null);

    const handleCheckUrl = useCallback(async () => {
        if (!appUrl.trim()) return;

        setIsChecking(true);
        setCheckResults([
            { id: 'https', label: 'HTTPS', status: 'pending' },
            { id: 'reachable', label: 'Reachable', status: 'pending' },
            { id: 'cors', label: 'CORS Headers', status: 'pending' },
        ]);

        const results = await checkUrl(appUrl.trim());
        setCheckResults(results);
        setIsChecking(false);
    }, [appUrl]);

    // Auto-check when URL looks complete
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setAppUrl(newUrl);

        // Reset results when URL changes
        if (checkResults) {
            setCheckResults(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Configure Your Existing App</h3>

                <p className="text-gray-600">
                    Your app will run inside an iframe in the LearnCard wallet. Enter your URL and we'll 
                    check if it's ready for embedding.
                </p>
            </div>

            {/* URL input with check button */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your App URL</label>

                <div className="flex gap-2">
                    <input
                        type="url"
                        value={appUrl}
                        onChange={handleUrlChange}
                        placeholder="https://your-app.com"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && appUrl.trim()) {
                                handleCheckUrl();
                            }
                        }}
                    />

                    <button
                        onClick={handleCheckUrl}
                        disabled={!appUrl.trim() || isChecking}
                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isChecking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        Check
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                    Enter your URL and click Check to verify requirements
                </p>
            </div>

            {/* URL Check Results */}
            {checkResults && (
                <UrlCheckResults results={checkResults} isChecking={isChecking} />
            )}

            {/* Required headers */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2">Required Response Headers</h4>

                <p className="text-sm text-amber-700 mb-3">
                    Your server must return these headers to allow iframe embedding:
                </p>

                <CodeOutputPanel
                    title="Server Headers"
                    snippets={{
                        typescript: `// Express.js example
app.use((req, res, next) => {
    // Allow iframe embedding from any origin
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    next();
});`,
                        curl: `# Nginx configuration
location / {
    add_header X-Frame-Options "ALLOWALL";
    add_header Content-Security-Policy "frame-ancestors *";
    add_header Access-Control-Allow-Origin "*";
}`,
                        python: `# Flask example
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.after_request
def add_headers(response):
    response.headers['X-Frame-Options'] = 'ALLOWALL'
    response.headers['Content-Security-Policy'] = 'frame-ancestors *'
    return response`,
                    }}
                    defaultLanguage="typescript"
                />
            </div>

            {/* Common issues */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">Common Issues</h4>

                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">!</span>
                        <div>
                            <strong className="text-gray-700">Blank iframe?</strong>
                            <span className="text-gray-600"> — Check your X-Frame-Options header isn't set to DENY or SAMEORIGIN</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">!</span>
                        <div>
                            <strong className="text-gray-700">Mixed content error?</strong>
                            <span className="text-gray-600"> — Make sure your app uses HTTPS</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">!</span>
                        <div>
                            <strong className="text-gray-700">CORS errors?</strong>
                            <span className="text-gray-600"> — Add Access-Control-Allow-Origin header</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 2: Install SDK
const InstallSdkStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Install the SDK</h3>

                <p className="text-gray-600">
                    The Partner Connect SDK lets your embedded app communicate with the LearnCard wallet.
                </p>
            </div>

            <CodeOutputPanel
                title="Installation"
                snippets={{
                    typescript: `# npm
npm install @learncard/partner-connect

# yarn
yarn add @learncard/partner-connect

# pnpm
pnpm add @learncard/partner-connect`,
                }}
            />

            {/* What you get */}
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                <h4 className="font-medium text-cyan-800 mb-3">What's included</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Single Sign-On</p>
                            <p className="text-xs text-cyan-600">Get user identity instantly</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Send Credentials</p>
                            <p className="text-xs text-cyan-600">Issue VCs to the wallet</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Request Credentials</p>
                            <p className="text-xs text-cyan-600">Search user's wallet</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Navigation</p>
                            <p className="text-xs text-cyan-600">Launch wallet features</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 3: Initialize
const InitializeStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const initCode = `import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Request user identity (like SSO)
const identity = await learnCard.requestIdentity();

console.log('User DID:', identity.did);
console.log('User Profile:', identity.profile);
// profile contains: displayName, profileId, image, etc.`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Initialize the SDK</h3>

                <p className="text-gray-600">
                    Set up the SDK when your app loads. You can immediately request the user's identity — 
                    no login required since they're already in the wallet.
                </p>
            </div>

            <CodeOutputPanel
                title="Initialization Code"
                snippets={{ typescript: initCode }}
            />

            {/* Identity response example */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">Example Response</h4>

                <pre className="text-sm text-gray-600 bg-white p-3 rounded-lg overflow-x-auto">
{`{
  "did": "did:web:network.learncard.com:users:abc123",
  "profile": {
    "displayName": "John Doe",
    "profileId": "johndoe",
    "image": "https://..."
  }
}`}
                </pre>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 4: Use API
const UseApiStep: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const [selectedMethod, setSelectedMethod] = useState('sendCredential');

    const methods = [
        {
            id: 'sendCredential',
            name: 'sendCredential()',
            description: 'Send a credential to the user\'s wallet',
            code: `// Send a credential to the wallet
const result = await learnCard.sendCredential({
    credential: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential", "Achievement"],
        "issuer": "did:web:your-app.com",
        "credentialSubject": {
            "name": "Course Completion",
            "description": "Completed JavaScript 101"
        }
    }
});

if (result.success) {
    console.log('Credential saved to wallet!');
}`,
        },
        {
            id: 'askCredentialSearch',
            name: 'askCredentialSearch()',
            description: 'Search for credentials in the wallet',
            code: `// Search user's credentials
const results = await learnCard.askCredentialSearch({
    type: ['VerifiableCredential', 'Achievement']
});

// User will be prompted to select credentials to share
console.log('Shared credentials:', results.credentials);`,
        },
        {
            id: 'launchFeature',
            name: 'launchFeature()',
            description: 'Navigate the wallet to a specific page',
            code: `// Open the wallet's credential view
await learnCard.launchFeature('/wallet', 'View your credentials');

// Or open contacts
await learnCard.launchFeature('/contacts', 'Find connections');`,
        },
        {
            id: 'requestConsent',
            name: 'requestConsent()',
            description: 'Request consent for data sharing',
            code: `// Request user consent for a contract
const consent = await learnCard.requestConsent('lc:contract:abc123');

if (consent.granted) {
    console.log('User granted consent!');
    // Now you can access data per the contract terms
}`,
        },
    ];

    const selectedMethodData = methods.find(m => m.id === selectedMethod);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Use the API</h3>

                <p className="text-gray-600">
                    Now you can interact with the wallet. Select a method below to see how it works.
                </p>
            </div>

            {/* Method selector */}
            <div className="flex flex-wrap gap-2">
                {methods.map(method => (
                    <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedMethod === method.id
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {method.name}
                    </button>
                ))}
            </div>

            {/* Selected method */}
            {selectedMethodData && (
                <div className="space-y-3">
                    <p className="text-gray-600">{selectedMethodData.description}</p>

                    <CodeOutputPanel
                        title={selectedMethodData.name}
                        snippets={{ typescript: selectedMethodData.code }}
                    />
                </div>
            )}

            {/* Success state */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to build!</h4>

                <p className="text-gray-600 mb-4">
                    You have everything you need to build an embedded LearnCard app.
                </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <a
                    href="https://docs.learncard.com/sdks/partner-connect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Full Documentation
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

// Main component
const EmbedAppGuide: React.FC = () => {
    const guideState = useGuideState('embed-app', STEPS.length);
    const [appUrl, setAppUrl] = useState('');
    const [appType, setAppType] = useState<AppType>(null);
    const [selectedFramework, setSelectedFramework] = useState('');

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const handlePathComplete = (selectedAppType: AppType) => {
        setAppType(selectedAppType);
        handleStepComplete('choose-path');
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <ChoosePathStep
                        onComplete={handlePathComplete}
                        appType={appType}
                        setAppType={setAppType}
                    />
                );

            case 1:
                return (
                    <SetupWebsiteStep
                        onComplete={() => handleStepComplete('setup-website')}
                        onBack={guideState.prevStep}
                        appUrl={appUrl}
                        setAppUrl={setAppUrl}
                        appType={appType}
                        selectedFramework={selectedFramework}
                        setSelectedFramework={setSelectedFramework}
                    />
                );

            case 2:
                return (
                    <InstallSdkStep
                        onComplete={() => handleStepComplete('install-sdk')}
                        onBack={guideState.prevStep}
                    />
                );

            case 3:
                return (
                    <InitializeStep
                        onComplete={() => handleStepComplete('initialize')}
                        onBack={guideState.prevStep}
                    />
                );

            case 4:
                return (
                    <UseApiStep
                        onBack={guideState.prevStep}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-4">
            <div className="mb-8">
                <StepProgress
                    currentStep={guideState.currentStep}
                    totalSteps={STEPS.length}
                    steps={STEPS}
                    completedSteps={guideState.state.completedSteps}
                    onStepClick={guideState.goToStep}
                />
            </div>

            {renderStep()}
        </div>
    );
};

export default EmbedAppGuide;
