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

const fr_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estimé`)
};

const ar_pathways_estimated = /** @type {(inputs: Pathways_EstimatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقديري`)
};

/**
* | output |
* | --- |
* | "Estimated" |
*
* @param {Pathways_EstimatedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_estimated = /** @type {((inputs?: Pathways_EstimatedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_EstimatedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_estimated(inputs)
	if (locale === "es") return es_pathways_estimated(inputs)
	if (locale === "fr") return fr_pathways_estimated(inputs)
	return ar_pathways_estimated(inputs)
});
export { pathways_estimated as "pathways.estimated" }