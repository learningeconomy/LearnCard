/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Close1Inputs */

const en_aiinsights_close1 = /** @type {(inputs: Aiinsights_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`close`)
};

const es_aiinsights_close1 = /** @type {(inputs: Aiinsights_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`cerrar`)
};

const fr_aiinsights_close1 = /** @type {(inputs: Aiinsights_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ar_aiinsights_close1 = /** @type {(inputs: Aiinsights_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

/**
* | output |
* | --- |
* | "close" |
*
* @param {Aiinsights_Close1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_close1 = /** @type {((inputs?: Aiinsights_Close1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Close1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_close1(inputs)
	if (locale === "es") return es_aiinsights_close1(inputs)
	if (locale === "fr") return fr_aiinsights_close1(inputs)
	return ar_aiinsights_close1(inputs)
});
export { aiinsights_close1 as "aiInsights.close" }