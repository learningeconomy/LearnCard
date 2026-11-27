/** Loads the accessiBe widget. Inline so it starts before the app bundle, as it did in index.html. */
export const ACCESSIBILITY_WIDGET_SCRIPT = `(function () {
    var hostname = window.location.hostname;
    var isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

    // Private credential links must not initialize third-party page observers.
    if (isLocalhost || /^\\/s(?:\\/|$)/.test(window.location.pathname)) {
        return;
    }

    var s = document.createElement('script');
    var h = document.querySelector('head') || document.body;
    s.src = 'https://acsbapp.com/apps/app/dist/js/app.js';
    s.async = true;
    s.onload = function () {
        acsbJS.init({
            statementLink: '',
            footerHtml: '',
            hideMobile: false,
            hideTrigger: false,
            disableBgProcess: false,
            language: 'en',
            position: 'left',
            leadColor: '#146ff8',
            triggerColor: '#146ff8',
            triggerRadius: '50%',
            triggerPositionX: 'right',
            triggerPositionY: 'bottom',
            triggerIcon: 'people',
            triggerSize: 'medium',
            triggerOffsetX: 20,
            triggerOffsetY: 90,
            mobile: {
                triggerSize: 'small',
                triggerPositionX: 'right',
                triggerPositionY: 'bottom',
                triggerOffsetX: 10,
                triggerOffsetY: 10,
                triggerRadius: '50%',
            },
        });
    };
    h.appendChild(s);
})();`;
