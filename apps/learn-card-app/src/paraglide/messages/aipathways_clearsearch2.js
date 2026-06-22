/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Clearsearch2Inputs */

const en_aipathways_clearsearch2 = /** @type {(inputs: Aipathways_Clearsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clear search`)
};

const es_aipathways_clearsearch2 = /** @type {(inputs: Aipathways_Clearsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpiar búsqueda`)
};

const fr_aipathways_clearsearch2 = /** @type {(inputs: Aipathways_Clearsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Effacer la recherche`)
};

const ar_aipathways_clearsearch2 = /** @type {(inputs: Aipathways_Clearsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح البحث`)
};

/**
* | output |
* | --- |
* | "Clear search" |
*
* @param {Aipathways_Clearsearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_clearsearch2 = /** @type {((inputs?: Aipathways_Clearsearch2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Clearsearch2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_clearsearch2(inputs)
	if (locale === "es") return es_aipathways_clearsearch2(inputs)
	if (locale === "fr") return fr_aipathways_clearsearch2(inputs)
	return ar_aipathways_clearsearch2(inputs)
});
export { aipathways_clearsearch2 as "aiPathways.clearSearch" }