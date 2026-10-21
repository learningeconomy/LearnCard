import { useEffect, useRef, useState } from 'react';
import { getLogger } from '../../logging/logger';

const log = getLogger('did-auth');

/** Reuse pending signing work when useWallet returns a new function on each render. */
export const useDIDAuthPresentation = <T>(
    challenge: string,
    domain: string | undefined,
    issuePresentation: (challenge: string, domain?: string) => Promise<T>
): T | undefined => {
    const request = useRef<{ challenge: string; domain?: string; promise: Promise<T> }>();
    const [result, setResult] = useState<{ challenge: string; domain?: string; vp: T }>();

    useEffect(() => {
        if (!challenge) return undefined;
        if (request.current?.challenge !== challenge || request.current?.domain !== domain) {
            request.current = {
                challenge,
                domain,
                promise: Promise.resolve().then(() => issuePresentation(challenge, domain)),
            };
        }
        let cancelled = false;
        request.current.promise.then(
            vp => {
                if (!cancelled)
                    setResult(previous =>
                        previous &&
                        previous.vp === vp &&
                        previous.challenge === challenge &&
                        previous.domain === domain
                            ? previous
                            : { challenge, domain, vp }
                    );
            },
            error => {
                if (!cancelled) log.error('Unable to create DID-auth presentation', error);
            }
        );
        return () => {
            cancelled = true;
        };
    }, [challenge, domain, issuePresentation]);

    return result?.challenge === challenge && result.domain === domain ? result.vp : undefined;
};
