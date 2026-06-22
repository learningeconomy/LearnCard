/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Globaladminid2Inputs */

const en_category_globaladminid2 = /** @type {(inputs: Category_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Admin ID`)
};

const es_category_globaladminid2 = /** @type {(inputs: Category_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de administrador global`)
};

const fr_category_globaladminid2 = /** @type {(inputs: Category_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID d'administrateur global`)
};

const ar_category_globaladminid2 = /** @type {(inputs: Category_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرّف المسؤول العام`)
};

/**
* | output |
* | --- |
* | "Global Admin ID" |
*
* @param {Category_Globaladminid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_globaladminid2 = /** @type {((inputs?: Category_Globaladminid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Globaladminid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_globaladminid2(inputs)
	if (locale === "es") return es_category_globaladminid2(inputs)
	if (locale === "fr") return fr_category_globaladminid2(inputs)
	return ar_category_globaladminid2(inputs)
});
export { category_globaladminid2 as "category.globalAdminId" }