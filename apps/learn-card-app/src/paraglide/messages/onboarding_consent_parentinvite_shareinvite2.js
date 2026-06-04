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

const de_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einladung teilen`)
};

const ar_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الدعوة`)
};

const fr_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager l'invitation`)
};

const ko_onboarding_consent_parentinvite_shareinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Shareinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`초대 공유`)
};

/**
* | output |
* | --- |
* | "Share Invite" |
*
* @param {Onboarding_Consent_Parentinvite_Shareinvite2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_shareinvite2 = /** @type {((inputs?: Onboarding_Consent_Parentinvite_Shareinvite2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Shareinvite2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_parentinvite_shareinvite2(inputs)
	if (locale === "es") return es_onboarding_consent_parentinvite_shareinvite2(inputs)
	if (locale === "de") return de_onboarding_consent_parentinvite_shareinvite2(inputs)
	if (locale === "ar") return ar_onboarding_consent_parentinvite_shareinvite2(inputs)
	if (locale === "fr") return fr_onboarding_consent_parentinvite_shareinvite2(inputs)
	return ko_onboarding_consent_parentinvite_shareinvite2(inputs)
});
export { onboarding_consent_parentinvite_shareinvite2 as "onboarding.consent.parentInvite.shareInvite" }