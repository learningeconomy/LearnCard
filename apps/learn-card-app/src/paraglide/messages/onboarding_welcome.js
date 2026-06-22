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

const fr_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bienvenue sur`)
};

const ar_onboarding_welcome = /** @type {(inputs: Onboarding_WelcomeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرحباً بك في`)
};

/**
* | output |
* | --- |
* | "Welcome to" |
*
* @param {Onboarding_WelcomeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_welcome = /** @type {((inputs?: Onboarding_WelcomeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_WelcomeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_welcome(inputs)
	if (locale === "es") return es_onboarding_welcome(inputs)
	if (locale === "fr") return fr_onboarding_welcome(inputs)
	return ar_onboarding_welcome(inputs)
});
export { onboarding_welcome as "onboarding.welcome" }