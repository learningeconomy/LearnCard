/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Boostcms_Searchtroop4Inputs */

const en_boostcms_searchtroop4 = /** @type {(inputs: Boostcms_Searchtroop4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Search ${i?.name}...`)
};

const es_boostcms_searchtroop4 = /** @type {(inputs: Boostcms_Searchtroop4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buscar ${i?.name}...`)
};

const fr_boostcms_searchtroop4 = /** @type {(inputs: Boostcms_Searchtroop4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rechercher ${i?.name}...`)
};

const ar_boostcms_searchtroop4 = /** @type {(inputs: Boostcms_Searchtroop4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Search ${i?.name}...`)
};

/**
* | output |
* | --- |
* | "Search {name}..." |
*
* @param {Boostcms_Searchtroop4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_searchtroop4 = /** @type {((inputs: Boostcms_Searchtroop4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Searchtroop4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_searchtroop4(inputs)
	if (locale === "es") return es_boostcms_searchtroop4(inputs)
	if (locale === "fr") return fr_boostcms_searchtroop4(inputs)
	return ar_boostcms_searchtroop4(inputs)
});
export { boostcms_searchtroop4 as "boostCMS.searchTroop" }