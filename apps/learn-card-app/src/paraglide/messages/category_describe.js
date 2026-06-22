/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_DescribeInputs */

const en_category_describe = /** @type {(inputs: Category_DescribeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe`)
};

const es_category_describe = /** @type {(inputs: Category_DescribeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describir`)
};

const fr_category_describe = /** @type {(inputs: Category_DescribeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrire`)
};

const ar_category_describe = /** @type {(inputs: Category_DescribeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصف`)
};

/**
* | output |
* | --- |
* | "Describe" |
*
* @param {Category_DescribeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_describe = /** @type {((inputs?: Category_DescribeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_DescribeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_describe(inputs)
	if (locale === "es") return es_category_describe(inputs)
	if (locale === "fr") return fr_category_describe(inputs)
	return ar_category_describe(inputs)
});
export { category_describe as "category.describe" }