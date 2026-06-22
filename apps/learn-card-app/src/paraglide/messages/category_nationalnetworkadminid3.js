/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Nationalnetworkadminid3Inputs */

const en_category_nationalnetworkadminid3 = /** @type {(inputs: Category_Nationalnetworkadminid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Network Admin ID`)
};

const es_category_nationalnetworkadminid3 = /** @type {(inputs: Category_Nationalnetworkadminid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de administrador de red nacional`)
};

const fr_category_nationalnetworkadminid3 = /** @type {(inputs: Category_Nationalnetworkadminid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID d'administrateur de réseau national`)
};

const ar_category_nationalnetworkadminid3 = /** @type {(inputs: Category_Nationalnetworkadminid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرّف مسؤول الشبكة الوطنية`)
};

/**
* | output |
* | --- |
* | "National Network Admin ID" |
*
* @param {Category_Nationalnetworkadminid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_nationalnetworkadminid3 = /** @type {((inputs?: Category_Nationalnetworkadminid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Nationalnetworkadminid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_nationalnetworkadminid3(inputs)
	if (locale === "es") return es_category_nationalnetworkadminid3(inputs)
	if (locale === "fr") return fr_category_nationalnetworkadminid3(inputs)
	return ar_category_nationalnetworkadminid3(inputs)
});
export { category_nationalnetworkadminid3 as "category.nationalNetworkAdminId" }