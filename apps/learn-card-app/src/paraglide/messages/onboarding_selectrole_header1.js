/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Selectrole_Header1Inputs */

const en_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select what best describes you!`)
};

const es_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Selecciona lo que mejor te describe!`)
};

const fr_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez ce qui vous décrit le mieux !`)
};

const ar_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر ما يصفك بشكل أفضل!`)
};

/**
* | output |
* | --- |
* | "Select what best describes you!" |
*
* @param {Onboarding_Selectrole_Header1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_selectrole_header1 = /** @type {((inputs?: Onboarding_Selectrole_Header1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Selectrole_Header1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_selectrole_header1(inputs)
	if (locale === "es") return es_onboarding_selectrole_header1(inputs)
	if (locale === "fr") return fr_onboarding_selectrole_header1(inputs)
	return ar_onboarding_selectrole_header1(inputs)
});
export { onboarding_selectrole_header1 as "onboarding.selectRole.header" }