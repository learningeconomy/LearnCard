/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Nosearchresults5Inputs */

const en_boostcms_nosearchresults5 = /** @type {(inputs: Boostcms_Nosearchresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No search results`)
};

const es_boostcms_nosearchresults5 = /** @type {(inputs: Boostcms_Nosearchresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados`)
};

const fr_boostcms_nosearchresults5 = /** @type {(inputs: Boostcms_Nosearchresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat de recherche`)
};

const ar_boostcms_nosearchresults5 = /** @type {(inputs: Boostcms_Nosearchresults5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No search results`)
};

/**
* | output |
* | --- |
* | "No search results" |
*
* @param {Boostcms_Nosearchresults5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_nosearchresults5 = /** @type {((inputs?: Boostcms_Nosearchresults5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Nosearchresults5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_nosearchresults5(inputs)
	if (locale === "es") return es_boostcms_nosearchresults5(inputs)
	if (locale === "fr") return fr_boostcms_nosearchresults5(inputs)
	return ar_boostcms_nosearchresults5(inputs)
});
export { boostcms_nosearchresults5 as "boostCMS.noSearchResults" }