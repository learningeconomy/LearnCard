/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_EstimatedInputs */

const en_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estimated`)
};

const es_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estimado`)
};

const de_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Geschätzt`)
};

const ar_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقديري`)
};

const fr_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estimé`)
};

const ko_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`예상`)
};

/**
* | output |
* | --- |
* | "Estimated" |
*
* @param {Pathways_EstimatedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_estimated = /** @type {((inputs?: Pathways_EstimatedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_EstimatedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_estimated(inputs)
	if (locale === "es") return es_pathways_estimated(inputs)
	if (locale === "de") return de_pathways_estimated(inputs)
	if (locale === "ar") return ar_pathways_estimated(inputs)
	if (locale === "fr") return fr_pathways_estimated(inputs)
	return ko_pathways_estimated(inputs)
});
export { pathways_estimated as "pathways.estimated" }