/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Template_Noresults1Inputs */

const en_boost_template_noresults1 = /** @type {(inputs: Boost_Template_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results found`)
};

const es_boost_template_noresults1 = /** @type {(inputs: Boost_Template_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron resultados`)
};

const fr_boost_template_noresults1 = /** @type {(inputs: Boost_Template_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat trouvé`)
};

const ar_boost_template_noresults1 = /** @type {(inputs: Boost_Template_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على نتائج`)
};

/**
* | output |
* | --- |
* | "No results found" |
*
* @param {Boost_Template_Noresults1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_template_noresults1 = /** @type {((inputs?: Boost_Template_Noresults1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Template_Noresults1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_template_noresults1(inputs)
	if (locale === "es") return es_boost_template_noresults1(inputs)
	if (locale === "fr") return fr_boost_template_noresults1(inputs)
	return ar_boost_template_noresults1(inputs)
});
export { boost_template_noresults1 as "boost.template.noResults" }