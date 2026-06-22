/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Missingfields1Inputs */

const en_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing required fields`)
};

const es_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Campos requeridos faltantes`)
};

const fr_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Champs obligatoires manquants`)
};

const ar_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حقول مطلوبة ناقصة`)
};

/**
* | output |
* | --- |
* | "Missing required fields" |
*
* @param {Pathways_Missingfields1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_missingfields1 = /** @type {((inputs?: Pathways_Missingfields1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Missingfields1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_missingfields1(inputs)
	if (locale === "es") return es_pathways_missingfields1(inputs)
	if (locale === "fr") return fr_pathways_missingfields1(inputs)
	return ar_pathways_missingfields1(inputs)
});
export { pathways_missingfields1 as "pathways.missingFields" }