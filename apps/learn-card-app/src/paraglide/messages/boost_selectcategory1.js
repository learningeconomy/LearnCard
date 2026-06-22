/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Selectcategory1Inputs */

const en_boost_selectcategory1 = /** @type {(inputs: Boost_Selectcategory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Category`)
};

const es_boost_selectcategory1 = /** @type {(inputs: Boost_Selectcategory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar categoría`)
};

const fr_boost_selectcategory1 = /** @type {(inputs: Boost_Selectcategory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner une catégorie`)
};

const ar_boost_selectcategory1 = /** @type {(inputs: Boost_Selectcategory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار الفئة`)
};

/**
* | output |
* | --- |
* | "Select Category" |
*
* @param {Boost_Selectcategory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_selectcategory1 = /** @type {((inputs?: Boost_Selectcategory1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Selectcategory1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_selectcategory1(inputs)
	if (locale === "es") return es_boost_selectcategory1(inputs)
	if (locale === "fr") return fr_boost_selectcategory1(inputs)
	return ar_boost_selectcategory1(inputs)
});
export { boost_selectcategory1 as "boost.selectCategory" }