/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Members_Searchplaceholder1Inputs */

const en_family_members_searchplaceholder1 = /** @type {(inputs: Family_Members_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search...`)
};

const es_family_members_searchplaceholder1 = /** @type {(inputs: Family_Members_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar...`)
};

const fr_family_members_searchplaceholder1 = /** @type {(inputs: Family_Members_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher...`)
};

const ar_family_members_searchplaceholder1 = /** @type {(inputs: Family_Members_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحث...`)
};

/**
* | output |
* | --- |
* | "Search..." |
*
* @param {Family_Members_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_members_searchplaceholder1 = /** @type {((inputs?: Family_Members_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Members_Searchplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_members_searchplaceholder1(inputs)
	if (locale === "es") return es_family_members_searchplaceholder1(inputs)
	if (locale === "fr") return fr_family_members_searchplaceholder1(inputs)
	return ar_family_members_searchplaceholder1(inputs)
});
export { family_members_searchplaceholder1 as "family.members.searchPlaceholder" }