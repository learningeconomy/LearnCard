/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_ContinueInputs */

const en_onboarding_continue = /** @type {(inputs: Onboarding_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue`)
};

const es_onboarding_continue = /** @type {(inputs: Onboarding_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar`)
};

const de_onboarding_continue = /** @type {(inputs: Onboarding_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Weiter`)
};

const ar_onboarding_continue = /** @type {(inputs: Onboarding_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة`)
};

const fr_onboarding_continue = /** @type {(inputs: Onboarding_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer`)
};

const ko_onboarding_continue = /** @type {(inputs: Onboarding_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계속`)
};

/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Onboarding_ContinueInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_continue = /** @type {((inputs?: Onboarding_ContinueInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_ContinueInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_continue(inputs)
	if (locale === "es") return es_onboarding_continue(inputs)
	if (locale === "de") return de_onboarding_continue(inputs)
	if (locale === "ar") return ar_onboarding_continue(inputs)
	if (locale === "fr") return fr_onboarding_continue(inputs)
	return ko_onboarding_continue(inputs)
});
export { onboarding_continue as "onboarding.continue" }