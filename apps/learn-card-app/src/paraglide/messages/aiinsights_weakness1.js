/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Weakness1Inputs */

const en_aiinsights_weakness1 = /** @type {(inputs: Aiinsights_Weakness1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Weakness`)
};

const es_aiinsights_weakness1 = /** @type {(inputs: Aiinsights_Weakness1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Área a mejorar`)
};

const fr_aiinsights_weakness1 = /** @type {(inputs: Aiinsights_Weakness1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Faiblesse`)
};

const ar_aiinsights_weakness1 = /** @type {(inputs: Aiinsights_Weakness1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نقطة ضعف`)
};

/**
* | output |
* | --- |
* | "Weakness" |
*
* @param {Aiinsights_Weakness1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_weakness1 = /** @type {((inputs?: Aiinsights_Weakness1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Weakness1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_weakness1(inputs)
	if (locale === "es") return es_aiinsights_weakness1(inputs)
	if (locale === "fr") return fr_aiinsights_weakness1(inputs)
	return ar_aiinsights_weakness1(inputs)
});
export { aiinsights_weakness1 as "aiInsights.weakness" }