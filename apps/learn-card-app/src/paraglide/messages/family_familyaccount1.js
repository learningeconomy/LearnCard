/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Familyaccount1Inputs */

const en_family_familyaccount1 = /** @type {(inputs: Family_Familyaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family Account`)
};

const es_family_familyaccount1 = /** @type {(inputs: Family_Familyaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuenta familiar`)
};

const fr_family_familyaccount1 = /** @type {(inputs: Family_Familyaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compte familial`)
};

const ar_family_familyaccount1 = /** @type {(inputs: Family_Familyaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حساب العائلة`)
};

/**
* | output |
* | --- |
* | "Family Account" |
*
* @param {Family_Familyaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_familyaccount1 = /** @type {((inputs?: Family_Familyaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Familyaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_familyaccount1(inputs)
	if (locale === "es") return es_family_familyaccount1(inputs)
	if (locale === "fr") return fr_family_familyaccount1(inputs)
	return ar_family_familyaccount1(inputs)
});
export { family_familyaccount1 as "family.familyAccount" }