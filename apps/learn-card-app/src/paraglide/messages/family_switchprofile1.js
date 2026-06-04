/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Switchprofile1Inputs */

const en_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch Profile`)
};

const es_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar perfil`)
};

const de_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil wechseln`)
};

const ar_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تبديل الملف الشخصي`)
};

const fr_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer de profil`)
};

const ko_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 전환`)
};

/**
* | output |
* | --- |
* | "Switch Profile" |
*
* @param {Family_Switchprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const family_switchprofile1 = /** @type {((inputs?: Family_Switchprofile1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Switchprofile1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_switchprofile1(inputs)
	if (locale === "es") return es_family_switchprofile1(inputs)
	if (locale === "de") return de_family_switchprofile1(inputs)
	if (locale === "ar") return ar_family_switchprofile1(inputs)
	if (locale === "fr") return fr_family_switchprofile1(inputs)
	return ko_family_switchprofile1(inputs)
});
export { family_switchprofile1 as "family.switchProfile" }