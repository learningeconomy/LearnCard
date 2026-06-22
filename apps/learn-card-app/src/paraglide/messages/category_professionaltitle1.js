/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Professionaltitle1Inputs */

const en_category_professionaltitle1 = /** @type {(inputs: Category_Professionaltitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Professional Title`)
};

const es_category_professionaltitle1 = /** @type {(inputs: Category_Professionaltitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título profesional`)
};

const fr_category_professionaltitle1 = /** @type {(inputs: Category_Professionaltitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre professionnel`)
};

const ar_category_professionaltitle1 = /** @type {(inputs: Category_Professionaltitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسمى المهني`)
};

/**
* | output |
* | --- |
* | "Professional Title" |
*
* @param {Category_Professionaltitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_professionaltitle1 = /** @type {((inputs?: Category_Professionaltitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Professionaltitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_professionaltitle1(inputs)
	if (locale === "es") return es_category_professionaltitle1(inputs)
	if (locale === "fr") return fr_category_professionaltitle1(inputs)
	return ar_category_professionaltitle1(inputs)
});
export { category_professionaltitle1 as "category.professionalTitle" }