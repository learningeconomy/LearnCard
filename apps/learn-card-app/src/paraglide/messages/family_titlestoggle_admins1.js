/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titlestoggle_Admins1Inputs */

const en_family_titlestoggle_admins1 = /** @type {(inputs: Family_Titlestoggle_Admins1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admins`)
};

const es_family_titlestoggle_admins1 = /** @type {(inputs: Family_Titlestoggle_Admins1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administradores`)
};

const fr_family_titlestoggle_admins1 = /** @type {(inputs: Family_Titlestoggle_Admins1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateurs`)
};

const ar_family_titlestoggle_admins1 = /** @type {(inputs: Family_Titlestoggle_Admins1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسؤولون`)
};

/**
* | output |
* | --- |
* | "Admins" |
*
* @param {Family_Titlestoggle_Admins1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titlestoggle_admins1 = /** @type {((inputs?: Family_Titlestoggle_Admins1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titlestoggle_Admins1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titlestoggle_admins1(inputs)
	if (locale === "es") return es_family_titlestoggle_admins1(inputs)
	if (locale === "fr") return fr_family_titlestoggle_admins1(inputs)
	return ar_family_titlestoggle_admins1(inputs)
});
export { family_titlestoggle_admins1 as "family.titlesToggle.admins" }