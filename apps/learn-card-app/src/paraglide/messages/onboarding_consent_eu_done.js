/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_DoneInputs */

const en_onboarding_consent_eu_done = /** @type {(inputs: Onboarding_Consent_Eu_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Done`)
};

const es_onboarding_consent_eu_done = /** @type {(inputs: Onboarding_Consent_Eu_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listo`)
};

const de_onboarding_consent_eu_done = /** @type {(inputs: Onboarding_Consent_Eu_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fertig`)
};

const ar_onboarding_consent_eu_done = /** @type {(inputs: Onboarding_Consent_Eu_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم`)
};

const fr_onboarding_consent_eu_done = /** @type {(inputs: Onboarding_Consent_Eu_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminé`)
};

const ko_onboarding_consent_eu_done = /** @type {(inputs: Onboarding_Consent_Eu_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`완료`)
};

/**
* | output |
* | --- |
* | "Done" |
*
* @param {Onboarding_Consent_Eu_DoneInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_done = /** @type {((inputs?: Onboarding_Consent_Eu_DoneInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_DoneInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_done(inputs)
	if (locale === "es") return es_onboarding_consent_eu_done(inputs)
	if (locale === "de") return de_onboarding_consent_eu_done(inputs)
	if (locale === "ar") return ar_onboarding_consent_eu_done(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_done(inputs)
	return ko_onboarding_consent_eu_done(inputs)
});
export { onboarding_consent_eu_done as "onboarding.consent.eu.done" }