/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Searchtoexplore3Inputs */

const en_aipathways_searchtoexplore3 = /** @type {(inputs: Aipathways_Searchtoexplore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search to explore matching roles.`)
};

const es_aipathways_searchtoexplore3 = /** @type {(inputs: Aipathways_Searchtoexplore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Busca para explorar roles coincidentes.`)
};

const fr_aipathways_searchtoexplore3 = /** @type {(inputs: Aipathways_Searchtoexplore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherchez pour explorer les rôles correspondants.`)
};

const ar_aipathways_searchtoexplore3 = /** @type {(inputs: Aipathways_Searchtoexplore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابحث لاستكشاف الأدوار المطابقة.`)
};

/**
* | output |
* | --- |
* | "Search to explore matching roles." |
*
* @param {Aipathways_Searchtoexplore3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_searchtoexplore3 = /** @type {((inputs?: Aipathways_Searchtoexplore3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Searchtoexplore3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_searchtoexplore3(inputs)
	if (locale === "es") return es_aipathways_searchtoexplore3(inputs)
	if (locale === "fr") return fr_aipathways_searchtoexplore3(inputs)
	return ar_aipathways_searchtoexplore3(inputs)
});
export { aipathways_searchtoexplore3 as "aiPathways.searchToExplore" }