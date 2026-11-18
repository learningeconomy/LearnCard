/**
 * Shared button styles for the ClassLink "keep your account" surfaces, matching the
 * full-width actions of the recovery and onboarding screens.
 */

/** Full-width primary action. */
export const PRIMARY_BUTTON_CLASS =
    'w-full min-h-[48px] py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';

/** Full-width quiet action ("Not now", "OK" beside a primary). */
export const QUIET_BUTTON_CLASS =
    'w-full min-h-[48px] py-3 px-4 rounded-[20px] text-grayscale-600 font-medium text-sm hover:bg-grayscale-10 hover:text-grayscale-900 transition-colors disabled:opacity-40';

/** Primary action in the sticky bottom bar of an onboarding step (as on the profile step). */
export const ONBOARDING_PRIMARY_BUTTON_CLASS =
    'w-full min-h-[48px] py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-[0.98]';

/** Small text action inside a card or row ("Resend code", "Use a different email"). */
export const LINK_BUTTON_CLASS =
    'inline-flex items-center min-h-[44px] px-1 text-sm font-medium text-grayscale-700 underline underline-offset-2 hover:text-grayscale-900 disabled:no-underline disabled:text-grayscale-500 disabled:cursor-default';
