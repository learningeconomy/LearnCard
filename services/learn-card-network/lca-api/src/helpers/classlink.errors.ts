import { TRPCError } from '@trpc/server';

export class ClassLinkTenantNotAllowed extends TRPCError {
    readonly messageKey = 'classlink.tenantNotAllowed';

    constructor() {
        super({ code: 'FORBIDDEN', message: 'Your district does not support this sign-in yet.' });
        this.name = 'ClassLinkTenantNotAllowed';
    }
}

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
