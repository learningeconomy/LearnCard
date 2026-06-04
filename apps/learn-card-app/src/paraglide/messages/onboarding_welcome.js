/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_WelcomeInputs */

const en_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Welcome to`)
};

const es_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bienvenido a`)
};

const de_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Willkommen bei`)
};

const ar_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرحباً بك في`)
};

const fr_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bienvenue sur`)
};

const ko_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`환영합니다`)
};

/**
* | output |
* | --- |
* | "Welcome to" |
*
* @param {Onboarding_WelcomeInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_welcome = /** @type {((inputs?: Onboarding_WelcomeInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_WelcomeInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_welcome(inputs)
	if (locale === "es") return es_onboarding_welcome(inputs)
	if (locale === "de") return de_onboarding_welcome(inputs)
	if (locale === "ar") return ar_onboarding_welcome(inputs)
	if (locale === "fr") return fr_onboarding_welcome(inputs)
	return ko_onboarding_welcome(inputs)
});
export { onboarding_welcome as "onboarding.welcome" }