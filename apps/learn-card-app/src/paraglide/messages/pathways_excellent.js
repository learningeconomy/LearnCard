/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_ExcellentInputs */

const en_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excellent`)
};

const es_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excelente`)
};

const fr_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Excellent`)
};

const ar_pathways_excellent = /** @type {(inputs: Pathways_ExcellentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ممتاز`)
};

/**
* | output |
* | --- |
* | "Excellent" |
*
* @param {Pathways_ExcellentInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_excellent = /** @type {((inputs?: Pathways_ExcellentInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_ExcellentInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_excellent(inputs)
	if (locale === "es") return es_pathways_excellent(inputs)
	if (locale === "fr") return fr_pathways_excellent(inputs)
	return ar_pathways_excellent(inputs)
});
export { pathways_excellent as "pathways.excellent" }