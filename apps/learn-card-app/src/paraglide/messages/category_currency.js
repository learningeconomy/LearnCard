/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_CurrencyInputs */

const en_category_currency = /** @type {(inputs: Category_CurrencyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Currency`)
};

const es_category_currency = /** @type {(inputs: Category_CurrencyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Moneda`)
};

const fr_category_currency = /** @type {(inputs: Category_CurrencyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Monnaie`)
};

const ar_category_currency = /** @type {(inputs: Category_CurrencyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العملة`)
};

/**
* | output |
* | --- |
* | "Currency" |
*
* @param {Category_CurrencyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_currency = /** @type {((inputs?: Category_CurrencyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_CurrencyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_currency(inputs)
	if (locale === "es") return es_category_currency(inputs)
	if (locale === "fr") return fr_category_currency(inputs)
	return ar_category_currency(inputs)
});
export { category_currency as "category.currency" }