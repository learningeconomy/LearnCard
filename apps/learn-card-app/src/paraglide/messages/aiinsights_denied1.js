/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Denied1Inputs */

const en_aiinsights_denied1 = /** @type {(inputs: Aiinsights_Denied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Denied`)
};

const es_aiinsights_denied1 = /** @type {(inputs: Aiinsights_Denied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Denegado`)
};

const fr_aiinsights_denied1 = /** @type {(inputs: Aiinsights_Denied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refusé`)
};

const ar_aiinsights_denied1 = /** @type {(inputs: Aiinsights_Denied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرفوض`)
};

/**
* | output |
* | --- |
* | "Denied" |
*
* @param {Aiinsights_Denied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_denied1 = /** @type {((inputs?: Aiinsights_Denied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Denied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_denied1(inputs)
	if (locale === "es") return es_aiinsights_denied1(inputs)
	if (locale === "fr") return fr_aiinsights_denied1(inputs)
	return ar_aiinsights_denied1(inputs)
});
export { aiinsights_denied1 as "aiInsights.denied" }