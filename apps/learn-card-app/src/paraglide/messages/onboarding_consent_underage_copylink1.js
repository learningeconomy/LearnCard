/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Copylink1Inputs */

const en_onboarding_consent_underage_copylink1 = /** @type {(inputs: Onboarding_Consent_Underage_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy family link`)
};

const es_onboarding_consent_underage_copylink1 = /** @type {(inputs: Onboarding_Consent_Underage_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar enlace de la familia`)
};

const fr_onboarding_consent_underage_copylink1 = /** @type {(inputs: Onboarding_Consent_Underage_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le lien de la famille`)
};

const ar_onboarding_consent_underage_copylink1 = /** @type {(inputs: Onboarding_Consent_Underage_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ رابط العائلة`)
};

/**
* | output |
* | --- |
* | "Copy family link" |
*
* @param {Onboarding_Consent_Underage_Copylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_copylink1 = /** @type {((inputs?: Onboarding_Consent_Underage_Copylink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Copylink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_copylink1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_copylink1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_copylink1(inputs)
	return ar_onboarding_consent_underage_copylink1(inputs)
});
export { onboarding_consent_underage_copylink1 as "onboarding.consent.underage.copyLink" }