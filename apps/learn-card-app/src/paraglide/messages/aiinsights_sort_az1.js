/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Sort_Az1Inputs */

const en_aiinsights_sort_az1 = /** @type {(inputs: Aiinsights_Sort_Az1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A-Z`)
};

const es_aiinsights_sort_az1 = /** @type {(inputs: Aiinsights_Sort_Az1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A-Z`)
};

const fr_aiinsights_sort_az1 = /** @type {(inputs: Aiinsights_Sort_Az1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A-Z`)
};

const ar_aiinsights_sort_az1 = /** @type {(inputs: Aiinsights_Sort_Az1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أ-ي`)
};

/**
* | output |
* | --- |
* | "A-Z" |
*
* @param {Aiinsights_Sort_Az1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_sort_az1 = /** @type {((inputs?: Aiinsights_Sort_Az1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Sort_Az1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_sort_az1(inputs)
	if (locale === "es") return es_aiinsights_sort_az1(inputs)
	if (locale === "fr") return fr_aiinsights_sort_az1(inputs)
	return ar_aiinsights_sort_az1(inputs)
});
export { aiinsights_sort_az1 as "aiInsights.sort.az" }