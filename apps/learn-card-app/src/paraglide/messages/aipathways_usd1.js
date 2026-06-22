/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Usd1Inputs */

const en_aipathways_usd1 = /** @type {(inputs: Aipathways_Usd1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`USD`)
};

const es_aipathways_usd1 = /** @type {(inputs: Aipathways_Usd1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`USD`)
};

const fr_aipathways_usd1 = /** @type {(inputs: Aipathways_Usd1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`USD`)
};

const ar_aipathways_usd1 = /** @type {(inputs: Aipathways_Usd1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دولار أمريكي`)
};

/**
* | output |
* | --- |
* | "USD" |
*
* @param {Aipathways_Usd1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_usd1 = /** @type {((inputs?: Aipathways_Usd1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Usd1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_usd1(inputs)
	if (locale === "es") return es_aipathways_usd1(inputs)
	if (locale === "fr") return fr_aipathways_usd1(inputs)
	return ar_aipathways_usd1(inputs)
});
export { aipathways_usd1 as "aiPathways.usd" }