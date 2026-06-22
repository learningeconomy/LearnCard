/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Agegate_Checking1Inputs */

const en_onboarding_agegate_checking1 = /** @type {(inputs: Onboarding_Agegate_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

const es_onboarding_agegate_checking1 = /** @type {(inputs: Onboarding_Agegate_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comprobando...`)
};

const fr_onboarding_agegate_checking1 = /** @type {(inputs: Onboarding_Agegate_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification...`)
};

const ar_onboarding_agegate_checking1 = /** @type {(inputs: Onboarding_Agegate_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق...`)
};

/**
* | output |
* | --- |
* | "Checking..." |
*
* @param {Onboarding_Agegate_Checking1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_agegate_checking1 = /** @type {((inputs?: Onboarding_Agegate_Checking1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Agegate_Checking1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_agegate_checking1(inputs)
	if (locale === "es") return es_onboarding_agegate_checking1(inputs)
	if (locale === "fr") return fr_onboarding_agegate_checking1(inputs)
	return ar_onboarding_agegate_checking1(inputs)
});
export { onboarding_agegate_checking1 as "onboarding.ageGate.checking" }