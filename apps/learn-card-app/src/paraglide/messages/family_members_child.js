/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Members_ChildInputs */

const en_family_members_child = /** @type {(inputs: Family_Members_ChildInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Child`)
};

const es_family_members_child = /** @type {(inputs: Family_Members_ChildInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niño`)
};

const fr_family_members_child = /** @type {(inputs: Family_Members_ChildInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enfant`)
};

const ar_family_members_child = /** @type {(inputs: Family_Members_ChildInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طفل`)
};

/**
* | output |
* | --- |
* | "Child" |
*
* @param {Family_Members_ChildInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_members_child = /** @type {((inputs?: Family_Members_ChildInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Members_ChildInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_members_child(inputs)
	if (locale === "es") return es_family_members_child(inputs)
	if (locale === "fr") return fr_family_members_child(inputs)
	return ar_family_members_child(inputs)
});
export { family_members_child as "family.members.child" }