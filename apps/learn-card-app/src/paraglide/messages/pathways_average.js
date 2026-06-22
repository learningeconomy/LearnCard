/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_AverageInputs */

const en_pathways_average = /** @type {(inputs: Pathways_AverageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Average`)
};

const es_pathways_average = /** @type {(inputs: Pathways_AverageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Promedio`)
};

const fr_pathways_average = /** @type {(inputs: Pathways_AverageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Moyen`)
};

const ar_pathways_average = /** @type {(inputs: Pathways_AverageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متوسط`)
};

/**
* | output |
* | --- |
* | "Average" |
*
* @param {Pathways_AverageInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_average = /** @type {((inputs?: Pathways_AverageInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_AverageInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_average(inputs)
	if (locale === "es") return es_pathways_average(inputs)
	if (locale === "fr") return fr_pathways_average(inputs)
	return ar_pathways_average(inputs)
});
export { pathways_average as "pathways.average" }