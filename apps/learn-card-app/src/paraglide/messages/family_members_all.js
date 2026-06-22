/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Members_AllInputs */

const en_family_members_all = /** @type {(inputs: Family_Members_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_family_members_all = /** @type {(inputs: Family_Members_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos`)
};

const fr_family_members_all = /** @type {(inputs: Family_Members_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous`)
};

const ar_family_members_all = /** @type {(inputs: Family_Members_AllInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Family_Members_AllInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_members_all = /** @type {((inputs?: Family_Members_AllInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Members_AllInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_members_all(inputs)
	if (locale === "es") return es_family_members_all(inputs)
	if (locale === "fr") return fr_family_members_all(inputs)
	return ar_family_members_all(inputs)
});
export { family_members_all as "family.members.all" }