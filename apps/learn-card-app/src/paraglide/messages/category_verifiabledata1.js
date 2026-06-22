/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Verifiabledata1Inputs */

const en_category_verifiabledata1 = /** @type {(inputs: Category_Verifiabledata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifiable Data`)
};

const es_category_verifiabledata1 = /** @type {(inputs: Category_Verifiabledata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datos verificables`)
};

const fr_category_verifiabledata1 = /** @type {(inputs: Category_Verifiabledata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Données vérifiables`)
};

const ar_category_verifiabledata1 = /** @type {(inputs: Category_Verifiabledata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البيانات القابلة للتحقق`)
};

/**
* | output |
* | --- |
* | "Verifiable Data" |
*
* @param {Category_Verifiabledata1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_verifiabledata1 = /** @type {((inputs?: Category_Verifiabledata1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Verifiabledata1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_verifiabledata1(inputs)
	if (locale === "es") return es_category_verifiabledata1(inputs)
	if (locale === "fr") return fr_category_verifiabledata1(inputs)
	return ar_category_verifiabledata1(inputs)
});
export { category_verifiabledata1 as "category.verifiableData" }