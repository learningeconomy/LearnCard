/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ min: NonNullable<unknown>, max: NonNullable<unknown> }} Aiinsights_Range1Inputs */

const en_aiinsights_range1 = /** @type {(inputs: Aiinsights_Range1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Range: ${i?.min} - ${i?.max}`)
};

const es_aiinsights_range1 = /** @type {(inputs: Aiinsights_Range1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rango: ${i?.min} - ${i?.max}`)
};

const fr_aiinsights_range1 = /** @type {(inputs: Aiinsights_Range1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Fourchette : ${i?.min} - ${i?.max}`)
};

const ar_aiinsights_range1 = /** @type {(inputs: Aiinsights_Range1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`النطاق: ${i?.min} - ${i?.max}`)
};

/**
* | output |
* | --- |
* | "Range: {min} - {max}" |
*
* @param {Aiinsights_Range1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_range1 = /** @type {((inputs: Aiinsights_Range1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Range1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_range1(inputs)
	if (locale === "es") return es_aiinsights_range1(inputs)
	if (locale === "fr") return fr_aiinsights_range1(inputs)
	return ar_aiinsights_range1(inputs)
});
export { aiinsights_range1 as "aiInsights.range" }