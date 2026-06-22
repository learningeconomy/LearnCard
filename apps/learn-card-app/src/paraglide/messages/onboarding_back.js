/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_BackInputs */

const en_onboarding_back = /** @type {(inputs: Onboarding_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_onboarding_back = /** @type {(inputs: Onboarding_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const fr_onboarding_back = /** @type {(inputs: Onboarding_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_onboarding_back = /** @type {(inputs: Onboarding_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Onboarding_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_back = /** @type {((inputs?: Onboarding_BackInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_BackInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_back(inputs)
	if (locale === "es") return es_onboarding_back(inputs)
	if (locale === "fr") return fr_onboarding_back(inputs)
	return ar_onboarding_back(inputs)
});
export { onboarding_back as "onboarding.back" }