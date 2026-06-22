/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Typetosearch3Inputs */

const en_aiinsights_typetosearch3 = /** @type {(inputs: Aiinsights_Typetosearch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type at least 2 letters to search.`)
};

const es_aiinsights_typetosearch3 = /** @type {(inputs: Aiinsights_Typetosearch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escribe al menos 2 letras para buscar.`)
};

const fr_aiinsights_typetosearch3 = /** @type {(inputs: Aiinsights_Typetosearch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tapez au moins 2 lettres pour rechercher.`)
};

const ar_aiinsights_typetosearch3 = /** @type {(inputs: Aiinsights_Typetosearch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتب حرفين على الأقل للبحث.`)
};

/**
* | output |
* | --- |
* | "Type at least 2 letters to search." |
*
* @param {Aiinsights_Typetosearch3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_typetosearch3 = /** @type {((inputs?: Aiinsights_Typetosearch3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Typetosearch3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_typetosearch3(inputs)
	if (locale === "es") return es_aiinsights_typetosearch3(inputs)
	if (locale === "fr") return fr_aiinsights_typetosearch3(inputs)
	return ar_aiinsights_typetosearch3(inputs)
});
export { aiinsights_typetosearch3 as "aiInsights.typeToSearch" }