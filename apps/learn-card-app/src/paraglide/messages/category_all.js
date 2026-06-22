/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_AllInputs */

const en_category_all = /** @type {(inputs: Category_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_category_all = /** @type {(inputs: Category_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todo`)
};

const fr_category_all = /** @type {(inputs: Category_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout`)
};

const ar_category_all = /** @type {(inputs: Category_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Category_AllInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_all = /** @type {((inputs?: Category_AllInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_AllInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_all(inputs)
	if (locale === "es") return es_category_all(inputs)
	if (locale === "fr") return fr_category_all(inputs)
	return ar_category_all(inputs)
});
export { category_all as "category.all" }