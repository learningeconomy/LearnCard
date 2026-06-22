/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Parentinvite_Shareinvite2Inputs */

const en_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Invite`)
};

const es_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir invitación`)
};

const fr_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager l'invitation`)
};

const ar_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الدعوة`)
};

/**
* | output |
* | --- |
* | "Share Invite" |
*
* @param {Onboarding_Consent_Parentinvite_Shareinvite2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_shareinvite2 = /** @type {((inputs?: Onboarding_Consent_Parentinvite_Shareinvite2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Shareinvite2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_parentinvite_shareinvite2(inputs)
	if (locale === "es") return es_onboarding_consent_parentinvite_shareinvite2(inputs)
	if (locale === "fr") return fr_onboarding_consent_parentinvite_shareinvite2(inputs)
	return ar_onboarding_consent_parentinvite_shareinvite2(inputs)
});
export { onboarding_consent_parentinvite_shareinvite2 as "onboarding.consent.parentInvite.shareInvite" }