/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Boostcms_Searchnetworkspecific5Inputs */

const en_boostcms_searchnetworkspecific5 = /** @type {(inputs: Boostcms_Searchnetworkspecific5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Search ${i?.name}...`)
};

const es_boostcms_searchnetworkspecific5 = /** @type {(inputs: Boostcms_Searchnetworkspecific5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buscar ${i?.name}...`)
};

const fr_boostcms_searchnetworkspecific5 = /** @type {(inputs: Boostcms_Searchnetworkspecific5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rechercher ${i?.name}...`)
};

const ar_boostcms_searchnetworkspecific5 = /** @type {(inputs: Boostcms_Searchnetworkspecific5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`بحث في ${i?.name}...`)
};

/**
* | output |
* | --- |
* | "Search {name}..." |
*
* @param {Boostcms_Searchnetworkspecific5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_searchnetworkspecific5 = /** @type {((inputs: Boostcms_Searchnetworkspecific5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Searchnetworkspecific5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_searchnetworkspecific5(inputs)
	if (locale === "es") return es_boostcms_searchnetworkspecific5(inputs)
	if (locale === "fr") return fr_boostcms_searchnetworkspecific5(inputs)
	return ar_boostcms_searchnetworkspecific5(inputs)
});
export { boostcms_searchnetworkspecific5 as "boostCMS.searchNetworkSpecific" }