/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_ConfidentInputs */

const en_pathways_confident = /** @type {(inputs: Pathways_ConfidentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confident`)
};

const es_pathways_confident = /** @type {(inputs: Pathways_ConfidentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confiado`)
};

const fr_pathways_confident = /** @type {(inputs: Pathways_ConfidentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confiant`)
};

const ar_pathways_confident = /** @type {(inputs: Pathways_ConfidentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`واثق`)
};

/**
* | output |
* | --- |
* | "Confident" |
*
* @param {Pathways_ConfidentInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_confident = /** @type {((inputs?: Pathways_ConfidentInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_ConfidentInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_confident(inputs)
	if (locale === "es") return es_pathways_confident(inputs)
	if (locale === "fr") return fr_pathways_confident(inputs)
	return ar_pathways_confident(inputs)
});
export { pathways_confident as "pathways.confident" }