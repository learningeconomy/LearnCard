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

const fr_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer de profil`)
};

const ar_family_switchprofile1 = /** @type {(inputs: Family_Switchprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تبديل الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Switch Profile" |
*
* @param {Family_Switchprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_switchprofile1 = /** @type {((inputs?: Family_Switchprofile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Switchprofile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_switchprofile1(inputs)
	if (locale === "es") return es_family_switchprofile1(inputs)
	if (locale === "fr") return fr_family_switchprofile1(inputs)
	return ar_family_switchprofile1(inputs)
});
export { family_switchprofile1 as "family.switchProfile" }