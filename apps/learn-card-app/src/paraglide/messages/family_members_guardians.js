/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Members_GuardiansInputs */

const en_family_members_guardians = /** @type {(inputs: Family_Members_GuardiansInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardians`)
};

const es_family_members_guardians = /** @type {(inputs: Family_Members_GuardiansInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tutores`)
};

const fr_family_members_guardians = /** @type {(inputs: Family_Members_GuardiansInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tuteurs`)
};

const ar_family_members_guardians = /** @type {(inputs: Family_Members_GuardiansInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أولياء الأمور`)
};

/**
* | output |
* | --- |
* | "Guardians" |
*
* @param {Family_Members_GuardiansInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_members_guardians = /** @type {((inputs?: Family_Members_GuardiansInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Members_GuardiansInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_members_guardians(inputs)
	if (locale === "es") return es_family_members_guardians(inputs)
	if (locale === "fr") return fr_family_members_guardians(inputs)
	return ar_family_members_guardians(inputs)
});
export { family_members_guardians as "family.members.guardians" }