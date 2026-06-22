/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Members_ChildrenInputs */

const en_family_members_children = /** @type {(inputs: Family_Members_ChildrenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Children`)
};

const es_family_members_children = /** @type {(inputs: Family_Members_ChildrenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niños`)
};

const fr_family_members_children = /** @type {(inputs: Family_Members_ChildrenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enfants`)
};

const ar_family_members_children = /** @type {(inputs: Family_Members_ChildrenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أطفال`)
};

/**
* | output |
* | --- |
* | "Children" |
*
* @param {Family_Members_ChildrenInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_members_children = /** @type {((inputs?: Family_Members_ChildrenInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Members_ChildrenInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_members_children(inputs)
	if (locale === "es") return es_family_members_children(inputs)
	if (locale === "fr") return fr_family_members_children(inputs)
	return ar_family_members_children(inputs)
});
export { family_members_children as "family.members.children" }