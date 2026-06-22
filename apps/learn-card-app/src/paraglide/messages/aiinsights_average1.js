/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Average1Inputs */

const en_aiinsights_average1 = /** @type {(inputs: Aiinsights_Average1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`average`)
};

const es_aiinsights_average1 = /** @type {(inputs: Aiinsights_Average1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`promedio`)
};

const fr_aiinsights_average1 = /** @type {(inputs: Aiinsights_Average1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`moyenne`)
};

const ar_aiinsights_average1 = /** @type {(inputs: Aiinsights_Average1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتوسط`)
};

/**
* | output |
* | --- |
* | "average" |
*
* @param {Aiinsights_Average1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_average1 = /** @type {((inputs?: Aiinsights_Average1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Average1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_average1(inputs)
	if (locale === "es") return es_aiinsights_average1(inputs)
	if (locale === "fr") return fr_aiinsights_average1(inputs)
	return ar_aiinsights_average1(inputs)
});
export { aiinsights_average1 as "aiInsights.average" }