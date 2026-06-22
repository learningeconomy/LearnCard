/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Meritbadge1Inputs */

const en_category_meritbadge1 = /** @type {(inputs: Category_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merit Badge`)
};

const es_category_meritbadge1 = /** @type {(inputs: Category_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignia al mérito`)
};

const fr_category_meritbadge1 = /** @type {(inputs: Category_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge de mérite`)
};

const ar_category_meritbadge1 = /** @type {(inputs: Category_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارة الجدارة`)
};

/**
* | output |
* | --- |
* | "Merit Badge" |
*
* @param {Category_Meritbadge1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_meritbadge1 = /** @type {((inputs?: Category_Meritbadge1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Meritbadge1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_meritbadge1(inputs)
	if (locale === "es") return es_category_meritbadge1(inputs)
	if (locale === "fr") return fr_category_meritbadge1(inputs)
	return ar_category_meritbadge1(inputs)
});
export { category_meritbadge1 as "category.meritBadge" }