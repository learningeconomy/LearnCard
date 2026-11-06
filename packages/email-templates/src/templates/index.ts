// One export declaration per template module. Projects that resolve this package
// through its `development` condition (source) typecheck without `jsx`, and TypeScript
// reports TS6142 once per declaration that imports a .tsx module from this .ts file;
// a separate `export type` line for the same module would add a second report.

export {
    VerificationCode,
    getVerificationCodeSubject,
    type VerificationCodeProps,
    type VerificationCodeVariant,
} from './verification-code';

export { InboxClaim, getInboxClaimSubject, type InboxClaimProps } from './inbox-claim';

export {
    GuardianApproval,
    getGuardianApprovalSubject,
    type GuardianApprovalProps,
} from './guardian-approval';

export {
    AccountApproved,
    getAccountApprovedSubject,
    type AccountApprovedProps,
} from './account-approved';

export { RecoveryKey, getRecoveryKeySubject, type RecoveryKeyProps } from './recovery-key';

export {
    EndorsementRequest,
    getEndorsementRequestSubject,
    type EndorsementRequestProps,
} from './endorsement-request';

export {
    CredentialAwaitingGuardian,
    getCredentialAwaitingGuardianSubject,
    type CredentialAwaitingGuardianProps,
} from './credential-awaiting-guardian';

export {
    GuardianApprovedClaim,
    getGuardianApprovedClaimSubject,
    type GuardianApprovedClaimProps,
} from './guardian-approved-claim';

export {
    GuardianCredentialApproval,
    getGuardianCredentialApprovalSubject,
    type GuardianCredentialApprovalProps,
} from './guardian-credential-approval';

export {
    GuardianEmailOtp,
    getGuardianEmailOtpSubject,
    type GuardianEmailOtpProps,
} from './guardian-email-otp';

export {
    GuardianRejectedCredential,
    getGuardianRejectedCredentialSubject,
    type GuardianRejectedCredentialProps,
} from './guardian-rejected-credential';

export {
    EmailVerification,
    getEmailVerificationSubject,
    type EmailVerificationProps,
} from './email-verification';

export {
    CredentialUpdated,
    getCredentialUpdatedSubject,
    type CredentialUpdatedProps,
} from './credential-updated';

export {
    AccountSignInChanged,
    getAccountSignInChangedSubject,
    type AccountSignInChangedProps,
} from './account-sign-in-changed';

export {
    EscrowHoldStarted,
    getEscrowHoldStartedSubject,
    type EscrowHoldStartedProps,
} from './escrow-hold-started';

export {
    EscrowHoldReminder,
    getEscrowHoldReminderSubject,
    type EscrowHoldReminderProps,
} from './escrow-hold-reminder';

export {
    EscrowHoldReleased,
    getEscrowHoldReleasedSubject,
    type EscrowHoldReleasedProps,
} from './escrow-hold-released';

export {
    EscrowHoldCancelled,
    getEscrowHoldCancelledSubject,
    type EscrowHoldCancelledProps,
    type EscrowHoldCancelledReason,
} from './escrow-hold-cancelled';

export {
    EscrowPinLocked,
    getEscrowPinLockedSubject,
    type EscrowPinLockedProps,
} from './escrow-pin-locked';

export {
    EscrowPinSignIn,
    getEscrowPinSignInSubject,
    type EscrowPinSignInProps,
} from './escrow-pin-sign-in';

export {
    AccountSecured,
    getAccountSecuredSubject,
    type AccountSecuredProps,
} from './account-secured';

export { Announcement, getAnnouncementSubject, type AnnouncementProps } from './announcement';
