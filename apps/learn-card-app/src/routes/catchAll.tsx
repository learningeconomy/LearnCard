/** Unknown paths render nothing inside the app shell, so React Router never answers with its 404. */
export default function CatchAll() {
    return null;
}
