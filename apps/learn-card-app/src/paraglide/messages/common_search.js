/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_SearchInputs */

const en_common_search = /** @type {(inputs: Common_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search`)
};

const es_common_search = /** @type {(inputs: Common_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar`)
};

const fr_common_search = /** @type {(inputs: Common_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher`)
};

const ar_common_search = /** @type {(inputs: Common_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحث`)
};

/**
* | output |
* | --- |
* | "Search" |
*
* @param {Common_SearchInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_search = /** @type {((inputs?: Common_SearchInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_SearchInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_search(inputs)
	if (locale === "es") return es_common_search(inputs)
	if (locale === "fr") return fr_common_search(inputs)
	return ar_common_search(inputs)
});
export { common_search as "common.search" }