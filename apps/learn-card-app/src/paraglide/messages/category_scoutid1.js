/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Scoutid1Inputs */

const en_category_scoutid1 = /** @type {(inputs: Category_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout ID`)
};

const es_category_scoutid1 = /** @type {(inputs: Category_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de scout`)
};

const fr_category_scoutid1 = /** @type {(inputs: Category_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de scout`)
};

const ar_category_scoutid1 = /** @type {(inputs: Category_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرّف الكشّاف`)
};

/**
* | output |
* | --- |
* | "Scout ID" |
*
* @param {Category_Scoutid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_scoutid1 = /** @type {((inputs?: Category_Scoutid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Scoutid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_scoutid1(inputs)
	if (locale === "es") return es_category_scoutid1(inputs)
	if (locale === "fr") return fr_category_scoutid1(inputs)
	return ar_category_scoutid1(inputs)
});
export { category_scoutid1 as "category.scoutId" }