import { TRPCError } from '@trpc/server';

export class ClassLinkEmailMissing extends TRPCError {
    readonly messageKey = 'classlink.emailMissing';

    constructor() {
        super({ code: 'BAD_REQUEST', message: 'A verified school email is needed to sign in.' });
        this.name = 'ClassLinkEmailMissing';
    }
}

export class ClassLinkStateIdMissing extends TRPCError {
    readonly messageKey = 'classlink.stateIdMissing';

    constructor() {
        super({
            code: 'BAD_REQUEST',
            message: 'Your student information is unavailable. Contact your district.',
        });
        this.name = 'ClassLinkStateIdMissing';
    }
}

export class ClassLinkTokenInvalid extends TRPCError {
    readonly messageKey = 'classlink.tokenInvalid';

    constructor() {
        super({
            code: 'UNAUTHORIZED',
            message: 'We could not verify your sign-in. Please try again.',
        });
        this.name = 'ClassLinkTokenInvalid';
    }
}

/**
 * ClassLink itself could not be reached or answered with a server error (discovery,
 * JWKS or token endpoint network failure, timeout or 5xx). Not the user's fault, so it
 * is not counted toward abuse rate limits, and it is reported (SERVICE_UNAVAILABLE is
 * not in Sentry's ignore list) instead of being hidden as an invalid sign-in.
 */
export class ClassLinkProviderUnavailable extends TRPCError {
    readonly messageKey = 'classlink.providerUnavailable';

    constructor() {
        super({
            code: 'SERVICE_UNAVAILABLE',
            message:
                'School sign-in is temporarily unavailable. Please try again in a few minutes.',
        });
        this.name = 'ClassLinkProviderUnavailable';
    }
}
