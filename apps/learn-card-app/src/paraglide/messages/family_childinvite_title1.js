/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Childinvite_Title1Inputs */

const en_family_childinvite_title1 = /** @type {(inputs: Family_Childinvite_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Child Account`)
};

const es_family_childinvite_title1 = /** @type {(inputs: Family_Childinvite_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuenta de niño`)
};

const fr_family_childinvite_title1 = /** @type {(inputs: Family_Childinvite_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compte enfant`)
};

const ar_family_childinvite_title1 = /** @type {(inputs: Family_Childinvite_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حساب طفل`)
};

/**
* | output |
* | --- |
* | "Child Account" |
*
* @param {Family_Childinvite_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_childinvite_title1 = /** @type {((inputs?: Family_Childinvite_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childinvite_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childinvite_title1(inputs)
	if (locale === "es") return es_family_childinvite_title1(inputs)
	if (locale === "fr") return fr_family_childinvite_title1(inputs)
	return ar_family_childinvite_title1(inputs)
});
export { family_childinvite_title1 as "family.childInvite.title" }