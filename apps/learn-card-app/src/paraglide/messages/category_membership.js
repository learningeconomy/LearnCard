/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Category_MembershipInputs */

const en_category_membership = /** @type {(inputs: Category_MembershipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membership`)
};

const es_category_membership = /** @type {(inputs: Category_MembershipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membresía`)
};

const fr_category_membership = /** @type {(inputs: Category_MembershipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adhésion`)
};

const ar_category_membership = /** @type {(inputs: Category_MembershipInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العضوية`)
};

/**
* | output |
* | --- |
* | "Membership" |
*
* @param {Category_MembershipInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const category_membership = /** @type {((inputs?: Category_MembershipInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Category_MembershipInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_category_membership(inputs)
	if (locale === "es") return es_category_membership(inputs)
	if (locale === "fr") return fr_category_membership(inputs)
	return ar_category_membership(inputs)
});
export { category_membership as "category.membership" }