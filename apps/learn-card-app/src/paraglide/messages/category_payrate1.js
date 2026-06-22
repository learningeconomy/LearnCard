/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Payrate1Inputs */

const en_category_payrate1 = /** @type {(inputs: Category_Payrate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pay Rate`)
};

const es_category_payrate1 = /** @type {(inputs: Category_Payrate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tarifa de pago`)
};

const fr_category_payrate1 = /** @type {(inputs: Category_Payrate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Taux de rémunération`)
};

const ar_category_payrate1 = /** @type {(inputs: Category_Payrate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معدل الأجر`)
};

/**
* | output |
* | --- |
* | "Pay Rate" |
*
* @param {Category_Payrate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_payrate1 = /** @type {((inputs?: Category_Payrate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Payrate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_payrate1(inputs)
	if (locale === "es") return es_category_payrate1(inputs)
	if (locale === "fr") return fr_category_payrate1(inputs)
	return ar_category_payrate1(inputs)
});
export { category_payrate1 as "category.payRate" }