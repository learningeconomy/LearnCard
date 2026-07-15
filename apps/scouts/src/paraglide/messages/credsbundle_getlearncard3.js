/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Getlearncard3Inputs */

const en_credsbundle_getlearncard3 = /** @type {(inputs: Credsbundle_Getlearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get LearnCard`)
};

const es_credsbundle_getlearncard3 = /** @type {(inputs: Credsbundle_Getlearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener LearnCard`)
};

const fr_credsbundle_getlearncard3 = /** @type {(inputs: Credsbundle_Getlearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir LearnCard`)
};

const ar_credsbundle_getlearncard3 = /** @type {(inputs: Credsbundle_Getlearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get LearnCard`)
};

/**
* | output |
* | --- |
* | "Get LearnCard" |
*
* @param {Credsbundle_Getlearncard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_getlearncard3 = /** @type {((inputs?: Credsbundle_Getlearncard3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Getlearncard3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_getlearncard3(inputs)
	if (locale === "es") return es_credsbundle_getlearncard3(inputs)
	if (locale === "fr") return fr_credsbundle_getlearncard3(inputs)
	return ar_credsbundle_getlearncard3(inputs)
});
export { credsbundle_getlearncard3 as "credsBundle.getLearnCard" }