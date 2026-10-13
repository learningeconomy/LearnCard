/** Local, trusted parent of the partner iframe. No account SDK or secrets run here. */
export const partnerMessage = (event: MessageEvent, frame: Window | null, origin: string) => {
    if (!frame || event.source !== frame || event.origin !== origin) return;
    const value = event.data;
    if (
        !value ||
        value.protocol !== 'LEARNCARD_V1' ||
        typeof value.action !== 'string' ||
        typeof value.requestId !== 'string' ||
        value.requestId.length > 256 ||
        JSON.stringify(value).length > 256_000
    )
        return;
    return {
        protocol: 'LEARNCARD_V1',
        requestId: value.requestId,
        action: value.action,
        payload: value.payload ?? null,
    };
};

declare global {
    interface Window {
        nativeAppConfig?: { url: string; origin: string; fixture?: string };
        webkit?: { messageHandlers: { consumerNative: { postMessage: (value: unknown) => void } } };
        consumerReply?: (reply: unknown) => void;
    }
}
const config = typeof window === 'undefined' ? undefined : window.nativeAppConfig;
if (config) {
    const frame = document.createElement('iframe');
    frame.title = 'App';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    frame.style.cssText = 'border:0;width:100%;height:100%;display:block';
    window.addEventListener('message', event => {
        const request = partnerMessage(event, frame.contentWindow, config.origin);
        if (request) window.webkit?.messageHandlers.consumerNative.postMessage(request);
    });
    window.consumerReply = reply => frame.contentWindow?.postMessage(reply, config.origin);
    frame.addEventListener('load', () =>
        window.webkit?.messageHandlers.consumerNative.postMessage({
            protocol: 'NATIVE_UI',
            kind: 'loaded',
        })
    );
    if (config.fixture) frame.srcdoc = config.fixture;
    else {
        const url = new URL(config.url);
        url.searchParams.set('lc_host_override', 'https://staging.learncard.app');
        frame.src = url.href;
    }
    document.body.append(frame);
}
