/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_TroopInputs */

const en_category_troop = /** @type {(inputs: Category_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop`)
};

const es_category_troop = /** @type {(inputs: Category_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tropa`)
};

const fr_category_troop = /** @type {(inputs: Category_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troupe`)
};

const ar_category_troop = /** @type {(inputs: Category_TroopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الفرقة`)
};

/**
* | output |
* | --- |
* | "Troop" |
*
* @param {Category_TroopInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_troop = /** @type {((inputs?: Category_TroopInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_TroopInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_troop(inputs)
	if (locale === "es") return es_category_troop(inputs)
	if (locale === "fr") return fr_category_troop(inputs)
	return ar_category_troop(inputs)
});
export { category_troop as "category.troop" }