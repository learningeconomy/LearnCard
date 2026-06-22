/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Linkcopied1Inputs */

const en_onboarding_consent_underage_linkcopied1 = /** @type {(inputs: Onboarding_Consent_Underage_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link copied`)
};

const es_onboarding_consent_underage_linkcopied1 = /** @type {(inputs: Onboarding_Consent_Underage_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace copiado`)
};

const fr_onboarding_consent_underage_linkcopied1 = /** @type {(inputs: Onboarding_Consent_Underage_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien copié`)
};

const ar_onboarding_consent_underage_linkcopied1 = /** @type {(inputs: Onboarding_Consent_Underage_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ الرابط`)
};

/**
* | output |
* | --- |
* | "Link copied" |
*
* @param {Onboarding_Consent_Underage_Linkcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_linkcopied1 = /** @type {((inputs?: Onboarding_Consent_Underage_Linkcopied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Linkcopied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_linkcopied1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_linkcopied1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_linkcopied1(inputs)
	return ar_onboarding_consent_underage_linkcopied1(inputs)
});
export { onboarding_consent_underage_linkcopied1 as "onboarding.consent.underage.linkCopied" }