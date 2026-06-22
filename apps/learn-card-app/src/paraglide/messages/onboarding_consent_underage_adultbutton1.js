/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Adultbutton1Inputs */

const en_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I'm an Adult`)
};

const es_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soy adulto`)
};

const fr_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis adulte`)
};

const ar_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا بالغ`)
};

/**
* | output |
* | --- |
* | "I'm an Adult" |
*
* @param {Onboarding_Consent_Underage_Adultbutton1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_adultbutton1 = /** @type {((inputs?: Onboarding_Consent_Underage_Adultbutton1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Adultbutton1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_adultbutton1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_adultbutton1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_adultbutton1(inputs)
	return ar_onboarding_consent_underage_adultbutton1(inputs)
});
export { onboarding_consent_underage_adultbutton1 as "onboarding.consent.underage.adultButton" }