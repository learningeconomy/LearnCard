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

const de_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ich bin Erwachsener`)
};

const ar_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا بالغ`)
};

const fr_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je suis adulte`)
};

const ko_onboarding_consent_underage_adultbutton1 = /** @type {(inputs: Onboarding_Consent_Underage_Adultbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저는 성인입니다`)
};

/**
* | output |
* | --- |
* | "I'm an Adult" |
*
* @param {Onboarding_Consent_Underage_Adultbutton1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_adultbutton1 = /** @type {((inputs?: Onboarding_Consent_Underage_Adultbutton1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Adultbutton1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_adultbutton1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_adultbutton1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_adultbutton1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_adultbutton1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_adultbutton1(inputs)
	return ko_onboarding_consent_underage_adultbutton1(inputs)
});
export { onboarding_consent_underage_adultbutton1 as "onboarding.consent.underage.adultButton" }