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

const de_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pflichtfelder fehlen`)
};

const ar_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حقول مطلوبة ناقصة`)
};

const fr_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Champs obligatoires manquants`)
};

const ko_pathways_missingfields1 = /** @type {(inputs: Pathways_Missingfields1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`필수 항목 누락`)
};

/**
* | output |
* | --- |
* | "Missing required fields" |
*
* @param {Pathways_Missingfields1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_missingfields1 = /** @type {((inputs?: Pathways_Missingfields1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Missingfields1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_missingfields1(inputs)
	if (locale === "es") return es_pathways_missingfields1(inputs)
	if (locale === "de") return de_pathways_missingfields1(inputs)
	if (locale === "ar") return ar_pathways_missingfields1(inputs)
	if (locale === "fr") return fr_pathways_missingfields1(inputs)
	return ko_pathways_missingfields1(inputs)
});
export { pathways_missingfields1 as "pathways.missingFields" }