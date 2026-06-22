/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Generating1Inputs */

const en_aiinsights_generating1 = /** @type {(inputs: Aiinsights_Generating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating...`)
};

const es_aiinsights_generating1 = /** @type {(inputs: Aiinsights_Generating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando...`)
};

const fr_aiinsights_generating1 = /** @type {(inputs: Aiinsights_Generating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération...`)
};

const ar_aiinsights_generating1 = /** @type {(inputs: Aiinsights_Generating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري الإنشاء`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Aiinsights_Generating1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_generating1 = /** @type {((inputs?: Aiinsights_Generating1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Generating1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_generating1(inputs)
	if (locale === "es") return es_aiinsights_generating1(inputs)
	if (locale === "fr") return fr_aiinsights_generating1(inputs)
	return ar_aiinsights_generating1(inputs)
});
export { aiinsights_generating1 as "aiInsights.generating" }