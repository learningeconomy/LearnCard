/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Searchbyname3Inputs */

const en_aiinsights_searchbyname3 = /** @type {(inputs: Aiinsights_Searchbyname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search by name...`)
};

const es_aiinsights_searchbyname3 = /** @type {(inputs: Aiinsights_Searchbyname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar por nombre...`)
};

const fr_aiinsights_searchbyname3 = /** @type {(inputs: Aiinsights_Searchbyname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher par nom...`)
};

const ar_aiinsights_searchbyname3 = /** @type {(inputs: Aiinsights_Searchbyname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...البحث بالاسم`)
};

/**
* | output |
* | --- |
* | "Search by name..." |
*
* @param {Aiinsights_Searchbyname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_searchbyname3 = /** @type {((inputs?: Aiinsights_Searchbyname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Searchbyname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_searchbyname3(inputs)
	if (locale === "es") return es_aiinsights_searchbyname3(inputs)
	if (locale === "fr") return fr_aiinsights_searchbyname3(inputs)
	return ar_aiinsights_searchbyname3(inputs)
});
export { aiinsights_searchbyname3 as "aiInsights.searchByName" }