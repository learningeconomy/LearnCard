/* Host switcher for the badge-claim example pages.
 *
 * Renders a top bar of toggle buttons (Production / Staging / VetPass / Local)
 * and persists the selection in localStorage. On every page load it reads the
 * selection, then dynamically injects the <script src="/embed-sdk/badge-claim.js">
 * tag with the appropriate `data-host` attribute.
 *
 * Pages opt in by providing a `<div class="badge-claim-root" data-*>` element.
 * All its `data-*` attributes are forwarded to the generated <script> tag
 * (except `data-host`, which the switcher controls).
 *
 * Why dynamic injection instead of mutating a static <script> tag?
 *   badge-claim.js reads `document.currentScript.dataset.host` at execute-time.
 *   Mutating attributes on a parser-inserted <script> tag races with async
 *   execution and is unreliable. Inserting via createElement(script) guarantees
 *   the final `data-host` is in place before the browser fetches + runs it.
 */
(function () {
    const HOSTS = [
        { id: 'production', label: 'Production', url: 'https://learncard.app' },
        { id: 'staging', label: 'Staging', url: 'https://staging.learncard.ai' },
        { id: 'vetpass', label: 'VetPass', url: 'https://vetpass.app' },
        { id: 'local', label: 'Local (Netlify)', url: 'http://localhost:8888' },
    ];

    const STORAGE_KEY = 'badge-claim-example:host-id';
    const DEFAULT_HOST_ID = 'production';

    function getSelectedHost() {
        let id = DEFAULT_HOST_ID;
        try {
            id = window.localStorage.getItem(STORAGE_KEY) || DEFAULT_HOST_ID;
        } catch {
            // localStorage may be disabled (private mode, file://). Fall through to default.
        }
        return HOSTS.find(h => h.id === id) || HOSTS[0];
    }

    function setSelectedHost(id) {
        try {
            window.localStorage.setItem(STORAGE_KEY, id);
        } catch {
            // ignore
        }
    }

    function renderSwitcher(selected) {
        const mount = document.getElementById('host-switcher');
        if (!mount) return;

        const bar = document.createElement('div');
        bar.className = 'host-switcher';

        const label = document.createElement('span');
        label.className = 'host-switcher__label';
        label.textContent = 'Target host:';
        bar.appendChild(label);

        const group = document.createElement('div');
        group.className = 'host-switcher__group';

        for (const host of HOSTS) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className =
                'host-switcher__btn' +
                (host.id === selected.id ? ' host-switcher__btn--active' : '');
            btn.textContent = host.label;
            btn.setAttribute('data-host-id', host.id);
            btn.addEventListener('click', () => {
                if (host.id === selected.id) return;
                setSelectedHost(host.id);
                window.location.reload();
            });
            group.appendChild(btn);
        }

        bar.appendChild(group);

        const current = document.createElement('code');
        current.className = 'host-switcher__current';
        current.setAttribute('data-testid', 'active-host');
        current.textContent = selected.url;
        bar.appendChild(current);

        mount.replaceWith(bar);
    }

    function injectBadgeClaim(selected) {
        const root = document.querySelector('.badge-claim-root');
        if (!root) {
            console.warn('[host-switcher] no .badge-claim-root element on page');
            return;
        }

        const script = document.createElement('script');
        script.src = '/embed-sdk/badge-claim.js';
        script.setAttribute('data-host', selected.url);

        // When "Local" is the active host, a page may supply a `data-src-local`
        // sidecar pointing at a local fixture (e.g. `/badges/x.json`) so the
        // whole claim round-trip stays on localhost. Otherwise keep `data-src`
        // as authored — typically an `https://learncard.app/demo-badges/*`
        // deployed fixture that any brain-service can fetch.
        const useLocal = selected.id === 'local' && typeof root.dataset.srcLocal === 'string';

        // Forward every data-* attribute from the placeholder (except
        // data-host, which the switcher owns, and data-src-local, which is
        // a sidecar consumed here — it should never appear on the <script>).
        for (const name of Object.keys(root.dataset)) {
            if (name === 'host' || name === 'srcLocal') continue;
            if (name === 'src' && useLocal) {
                script.dataset.src = root.dataset.srcLocal;
                continue;
            }
            script.dataset[name] = root.dataset[name];
        }

        // Insert immediately after the placeholder so layout ordering is stable
        // (matters for auto-placement when data-target is absent).
        root.parentNode?.insertBefore(script, root.nextSibling);
    }

    function boot() {
        const selected = getSelectedHost();
        renderSwitcher(selected);
        injectBadgeClaim(selected);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
