/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Approved1Inputs */

const en_aiinsights_approved1 = /** @type {(inputs: Aiinsights_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approved`)
};

const es_aiinsights_approved1 = /** @type {(inputs: Aiinsights_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobado`)
};

const fr_aiinsights_approved1 = /** @type {(inputs: Aiinsights_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuvé`)
};

const ar_aiinsights_approved1 = /** @type {(inputs: Aiinsights_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الموافقة`)
};

/**
* | output |
* | --- |
* | "Approved" |
*
* @param {Aiinsights_Approved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_approved1 = /** @type {((inputs?: Aiinsights_Approved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Approved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_approved1(inputs)
	if (locale === "es") return es_aiinsights_approved1(inputs)
	if (locale === "fr") return fr_aiinsights_approved1(inputs)
	return ar_aiinsights_approved1(inputs)
});
export { aiinsights_approved1 as "aiInsights.approved" }