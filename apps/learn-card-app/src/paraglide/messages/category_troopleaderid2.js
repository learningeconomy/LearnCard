/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Troopleaderid2Inputs */

const en_category_troopleaderid2 = /** @type {(inputs: Category_Troopleaderid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop Leader ID`)
};

const es_category_troopleaderid2 = /** @type {(inputs: Category_Troopleaderid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de líder de tropa`)
};

const fr_category_troopleaderid2 = /** @type {(inputs: Category_Troopleaderid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de chef de troupe`)
};

const ar_category_troopleaderid2 = /** @type {(inputs: Category_Troopleaderid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرّف قائد الفرقة`)
};

/**
* | output |
* | --- |
* | "Troop Leader ID" |
*
* @param {Category_Troopleaderid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_troopleaderid2 = /** @type {((inputs?: Category_Troopleaderid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Troopleaderid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_troopleaderid2(inputs)
	if (locale === "es") return es_category_troopleaderid2(inputs)
	if (locale === "fr") return fr_category_troopleaderid2(inputs)
	return ar_category_troopleaderid2(inputs)
});
export { category_troopleaderid2 as "category.troopLeaderId" }