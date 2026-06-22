/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_Worklifebalance2Inputs */

const en_category_worklifebalance2 = /** @type {(inputs: Category_Worklifebalance2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Life Balance`)
};

const es_category_worklifebalance2 = /** @type {(inputs: Category_Worklifebalance2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Equilibrio entre trabajo y vida`)
};

const fr_category_worklifebalance2 = /** @type {(inputs: Category_Worklifebalance2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Équilibre vie professionnelle-vie privée`)
};

const ar_category_worklifebalance2 = /** @type {(inputs: Category_Worklifebalance2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوازن بين العمل والحياة`)
};

/**
* | output |
* | --- |
* | "Work Life Balance" |
*
* @param {Category_Worklifebalance2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_worklifebalance2 = /** @type {((inputs?: Category_Worklifebalance2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_Worklifebalance2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_worklifebalance2(inputs)
	if (locale === "es") return es_category_worklifebalance2(inputs)
	if (locale === "fr") return fr_category_worklifebalance2(inputs)
	return ar_category_worklifebalance2(inputs)
});
export { category_worklifebalance2 as "category.workLifeBalance" }