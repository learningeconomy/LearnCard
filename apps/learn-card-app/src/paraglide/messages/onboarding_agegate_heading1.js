/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Agegate_Heading1Inputs */

const en_onboarding_agegate_heading1 = /** @type {(inputs: Onboarding_Agegate_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter your age and country to continue`)
};

const es_onboarding_agegate_heading1 = /** @type {(inputs: Onboarding_Agegate_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa tu edad y país para continuar`)
};

const fr_onboarding_agegate_heading1 = /** @type {(inputs: Onboarding_Agegate_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir votre âge et votre pays pour continuer`)
};

const ar_onboarding_agegate_heading1 = /** @type {(inputs: Onboarding_Agegate_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال عمرك وبلدك للمتابعة`)
};

/**
* | output |
* | --- |
* | "Please enter your age and country to continue" |
*
* @param {Onboarding_Agegate_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_agegate_heading1 = /** @type {((inputs?: Onboarding_Agegate_Heading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Agegate_Heading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_agegate_heading1(inputs)
	if (locale === "es") return es_onboarding_agegate_heading1(inputs)
	if (locale === "fr") return fr_onboarding_agegate_heading1(inputs)
	return ar_onboarding_agegate_heading1(inputs)
});
export { onboarding_agegate_heading1 as "onboarding.ageGate.heading" }