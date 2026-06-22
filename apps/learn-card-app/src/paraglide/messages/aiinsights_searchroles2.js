/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Searchroles2Inputs */

const en_aiinsights_searchroles2 = /** @type {(inputs: Aiinsights_Searchroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search roles...`)
};

const es_aiinsights_searchroles2 = /** @type {(inputs: Aiinsights_Searchroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar roles...`)
};

const fr_aiinsights_searchroles2 = /** @type {(inputs: Aiinsights_Searchroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des rôles...`)
};

const ar_aiinsights_searchroles2 = /** @type {(inputs: Aiinsights_Searchroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...البحث عن أدوار`)
};

/**
* | output |
* | --- |
* | "Search roles..." |
*
* @param {Aiinsights_Searchroles2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_searchroles2 = /** @type {((inputs?: Aiinsights_Searchroles2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Searchroles2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_searchroles2(inputs)
	if (locale === "es") return es_aiinsights_searchroles2(inputs)
	if (locale === "fr") return fr_aiinsights_searchroles2(inputs)
	return ar_aiinsights_searchroles2(inputs)
});
export { aiinsights_searchroles2 as "aiInsights.searchRoles" }