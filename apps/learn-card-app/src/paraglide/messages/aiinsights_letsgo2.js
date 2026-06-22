/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Letsgo2Inputs */

const en_aiinsights_letsgo2 = /** @type {(inputs: Aiinsights_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let's Go!`)
};

const es_aiinsights_letsgo2 = /** @type {(inputs: Aiinsights_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Vamos!`)
};

const fr_aiinsights_letsgo2 = /** @type {(inputs: Aiinsights_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est parti !`)
};

const ar_aiinsights_letsgo2 = /** @type {(inputs: Aiinsights_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`!هيا بنا`)
};

/**
* | output |
* | --- |
* | "Let's Go!" |
*
* @param {Aiinsights_Letsgo2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_letsgo2 = /** @type {((inputs?: Aiinsights_Letsgo2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Letsgo2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_letsgo2(inputs)
	if (locale === "es") return es_aiinsights_letsgo2(inputs)
	if (locale === "fr") return fr_aiinsights_letsgo2(inputs)
	return ar_aiinsights_letsgo2(inputs)
});
export { aiinsights_letsgo2 as "aiInsights.letsGo" }