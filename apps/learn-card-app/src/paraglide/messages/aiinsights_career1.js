/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Career1Inputs */

const en_aiinsights_career1 = /** @type {(inputs: Aiinsights_Career1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Career`)
};

const es_aiinsights_career1 = /** @type {(inputs: Aiinsights_Career1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carrera`)
};

const fr_aiinsights_career1 = /** @type {(inputs: Aiinsights_Career1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carrière`)
};

const ar_aiinsights_career1 = /** @type {(inputs: Aiinsights_Career1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسار المهني`)
};

/**
* | output |
* | --- |
* | "Career" |
*
* @param {Aiinsights_Career1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_career1 = /** @type {((inputs?: Aiinsights_Career1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Career1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_career1(inputs)
	if (locale === "es") return es_aiinsights_career1(inputs)
	if (locale === "fr") return fr_aiinsights_career1(inputs)
	return ar_aiinsights_career1(inputs)
});
export { aiinsights_career1 as "aiInsights.career" }