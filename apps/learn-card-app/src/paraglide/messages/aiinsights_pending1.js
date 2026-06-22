/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Pending1Inputs */

const en_aiinsights_pending1 = /** @type {(inputs: Aiinsights_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending`)
};

const es_aiinsights_pending1 = /** @type {(inputs: Aiinsights_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pendiente`)
};

const fr_aiinsights_pending1 = /** @type {(inputs: Aiinsights_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

const ar_aiinsights_pending1 = /** @type {(inputs: Aiinsights_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Aiinsights_Pending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_pending1 = /** @type {((inputs?: Aiinsights_Pending1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Pending1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_pending1(inputs)
	if (locale === "es") return es_aiinsights_pending1(inputs)
	if (locale === "fr") return fr_aiinsights_pending1(inputs)
	return ar_aiinsights_pending1(inputs)
});
export { aiinsights_pending1 as "aiInsights.pending" }