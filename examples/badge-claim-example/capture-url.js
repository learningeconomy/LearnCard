/* Small helper: after badge-claim.js mounts, display the generated claim URL
 * in any element with [data-testid="generated-url"].
 * Also used by Playwright e2e tests as a stable hook.
 */
(function () {
    function update() {
        const target = document.querySelector('[data-testid="generated-url"]');
        if (!target) return false;

        const widget = document.querySelector('.lc-badge-claim');
        if (!widget) return false;

        // badge-claim.js writes the claim URL onto the widget container as
        // `data-claim-url`, which works for every mode (button, qr, both).
        const claimUrl =
            widget.getAttribute('data-claim-url') ||
            widget.querySelector('a.lc-badge-claim__button')?.getAttribute('href') ||
            '';

        if (!claimUrl) return false;

        target.textContent = claimUrl;
        target.setAttribute('data-url', claimUrl);
        return true;
    }

    const observer = new MutationObserver(() => {
        if (update()) observer.disconnect();
    });

    window.addEventListener('DOMContentLoaded', () => {
        if (!update()) {
            observer.observe(document.body, { subtree: true, childList: true });
            // Safety timeout.
            setTimeout(() => observer.disconnect(), 5000);
        }
    });
})();
