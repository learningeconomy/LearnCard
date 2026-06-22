/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Expired1Inputs */

const en_aiinsights_expired1 = /** @type {(inputs: Aiinsights_Expired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expired`)
};

const es_aiinsights_expired1 = /** @type {(inputs: Aiinsights_Expired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expirado`)
};

const fr_aiinsights_expired1 = /** @type {(inputs: Aiinsights_Expired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ar_aiinsights_expired1 = /** @type {(inputs: Aiinsights_Expired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهي الصلاحية`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Aiinsights_Expired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_expired1 = /** @type {((inputs?: Aiinsights_Expired1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Expired1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_expired1(inputs)
	if (locale === "es") return es_aiinsights_expired1(inputs)
	if (locale === "fr") return fr_aiinsights_expired1(inputs)
	return ar_aiinsights_expired1(inputs)
});
export { aiinsights_expired1 as "aiInsights.expired" }