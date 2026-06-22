/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Parentprofile1Inputs */

const en_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parent Profile`)
};

const es_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Perfil del padre`)
};

const fr_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil parent`)
};

const ar_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف ولي الأمر`)
};

/**
* | output |
* | --- |
* | "Parent Profile" |
*
* @param {Family_Parentprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_parentprofile1 = /** @type {((inputs?: Family_Parentprofile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Parentprofile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_parentprofile1(inputs)
	if (locale === "es") return es_family_parentprofile1(inputs)
	if (locale === "fr") return fr_family_parentprofile1(inputs)
	return ar_family_parentprofile1(inputs)
});
export { family_parentprofile1 as "family.parentProfile" }