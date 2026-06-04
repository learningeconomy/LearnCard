/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Childprofile1Inputs */

const en_family_childprofile1 = /** @type {(inputs: Family_Childprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Child Profile`)
};

const es_family_childprofile1 = /** @type {(inputs: Family_Childprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Perfil del niño`)
};

const de_family_childprofile1 = /** @type {(inputs: Family_Childprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kinderprofil`)
};

const ar_family_childprofile1 = /** @type {(inputs: Family_Childprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف الطفل`)
};

const fr_family_childprofile1 = /** @type {(inputs: Family_Childprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil enfant`)
};

const ko_family_childprofile1 = /** @type {(inputs: Family_Childprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자녀 프로필`)
};

/**
* | output |
* | --- |
* | "Child Profile" |
*
* @param {Family_Childprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const family_childprofile1 = /** @type {((inputs?: Family_Childprofile1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Childprofile1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_childprofile1(inputs)
	if (locale === "es") return es_family_childprofile1(inputs)
	if (locale === "de") return de_family_childprofile1(inputs)
	if (locale === "ar") return ar_family_childprofile1(inputs)
	if (locale === "fr") return fr_family_childprofile1(inputs)
	return ko_family_childprofile1(inputs)
});
export { family_childprofile1 as "family.childProfile" }