// `safe-regex` ships without types. The upstream shape is a single
// default export: `(pattern: string | RegExp, opts?: { limit?: number }) => boolean`.
declare module 'safe-regex' {
    interface SafeRegexOptions {
        limit?: number;
    }

    const safeRegex: (pattern: string | RegExp, opts?: SafeRegexOptions) => boolean;

    export default safeRegex;
}
