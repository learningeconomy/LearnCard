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

const de_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elternprofil`)
};

const ar_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف ولي الأمر`)
};

const fr_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil parent`)
};

const ko_family_parentprofile1 = /** @type {(inputs: Family_Parentprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학부모 프로필`)
};

/**
* | output |
* | --- |
* | "Parent Profile" |
*
* @param {Family_Parentprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const family_parentprofile1 = /** @type {((inputs?: Family_Parentprofile1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Parentprofile1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_parentprofile1(inputs)
	if (locale === "es") return es_family_parentprofile1(inputs)
	if (locale === "de") return de_family_parentprofile1(inputs)
	if (locale === "ar") return ar_family_parentprofile1(inputs)
	if (locale === "fr") return fr_family_parentprofile1(inputs)
	return ko_family_parentprofile1(inputs)
});
export { family_parentprofile1 as "family.parentProfile" }