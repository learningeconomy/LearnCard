/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Copyfailed1Inputs */

const en_onboarding_consent_underage_copyfailed1 = /** @type {(inputs: Onboarding_Consent_Underage_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to copy to clipboard.`)
};

const es_onboarding_consent_underage_copyfailed1 = /** @type {(inputs: Onboarding_Consent_Underage_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar al portapapeles.`)
};

const fr_onboarding_consent_underage_copyfailed1 = /** @type {(inputs: Onboarding_Consent_Underage_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la copie dans le presse-papiers.`)
};

const ar_onboarding_consent_underage_copyfailed1 = /** @type {(inputs: Onboarding_Consent_Underage_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر النسخ إلى الحافظة.`)
};

/**
* | output |
* | --- |
* | "Failed to copy to clipboard." |
*
* @param {Onboarding_Consent_Underage_Copyfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_copyfailed1 = /** @type {((inputs?: Onboarding_Consent_Underage_Copyfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Copyfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_copyfailed1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_copyfailed1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_copyfailed1(inputs)
	return ar_onboarding_consent_underage_copyfailed1(inputs)
});
export { onboarding_consent_underage_copyfailed1 as "onboarding.consent.underage.copyFailed" }