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
