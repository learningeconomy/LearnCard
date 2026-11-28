/**
 * Makes every path match, so React Router never answers with its own 404. The root route renders
 * the app itself (src/root.tsx): one App instance for every path, with its own <Routes>.
 */
export default function CatchAll() {
    return null;
}
