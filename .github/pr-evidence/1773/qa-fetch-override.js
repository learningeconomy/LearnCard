// QA ONLY: paste into DevTools on the PR frontend. Reload to remove.
// Normal auth/storage requests still use the configured deployed services.
(() => {
    const original = window.fetch.bind(window);
    const qa = window.uploadCapacityQA = { mode: 'recover', calls: 0, reset(mode = 'recover') { this.mode = mode; this.calls = 0; } };
    window.fetch = async (input, init) => {
        const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
        const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
        if (url.pathname === '/credentials/parse-file' && method.toUpperCase() === 'POST') {
            qa.calls += 1;
            if (qa.mode === 'busy' || (qa.mode === 'recover' && qa.calls === 1) || (qa.mode === 'owner' && qa.calls === 1)) {
                const owner = qa.mode === 'owner';
                return Response.json({ error: 'Synthetic QA admission rejection', code: owner ? 'upload_in_progress' : 'upload_capacity_exceeded' }, { status: owner ? 429 : 503, headers: { 'Retry-After': '5' } });
            }
        }
        return original(input, init);
    };
    console.info('Upload QA installed. Modes: recover (one 503 then real service), owner (one 429 then real service), busy (always 503), pass (all real). Reload to remove.');
})();
