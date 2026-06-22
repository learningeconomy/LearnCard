/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Searchingroles2Inputs */

const en_aiinsights_searchingroles2 = /** @type {(inputs: Aiinsights_Searchingroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Searching roles...`)
};

const es_aiinsights_searchingroles2 = /** @type {(inputs: Aiinsights_Searchingroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscando roles...`)
};

const fr_aiinsights_searchingroles2 = /** @type {(inputs: Aiinsights_Searchingroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherche de rôles...`)
};

const ar_aiinsights_searchingroles2 = /** @type {(inputs: Aiinsights_Searchingroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري البحث عن أدوار`)
};

/**
* | output |
* | --- |
* | "Searching roles..." |
*
* @param {Aiinsights_Searchingroles2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_searchingroles2 = /** @type {((inputs?: Aiinsights_Searchingroles2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Searchingroles2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_searchingroles2(inputs)
	if (locale === "es") return es_aiinsights_searchingroles2(inputs)
	if (locale === "fr") return fr_aiinsights_searchingroles2(inputs)
	return ar_aiinsights_searchingroles2(inputs)
});
export { aiinsights_searchingroles2 as "aiInsights.searchingRoles" }