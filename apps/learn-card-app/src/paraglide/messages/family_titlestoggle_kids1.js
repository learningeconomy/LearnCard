/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titlestoggle_Kids1Inputs */

const en_family_titlestoggle_kids1 = /** @type {(inputs: Family_Titlestoggle_Kids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kids`)
};

const es_family_titlestoggle_kids1 = /** @type {(inputs: Family_Titlestoggle_Kids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niños`)
};

const fr_family_titlestoggle_kids1 = /** @type {(inputs: Family_Titlestoggle_Kids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enfants`)
};

const ar_family_titlestoggle_kids1 = /** @type {(inputs: Family_Titlestoggle_Kids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأطفال`)
};

/**
* | output |
* | --- |
* | "Kids" |
*
* @param {Family_Titlestoggle_Kids1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titlestoggle_kids1 = /** @type {((inputs?: Family_Titlestoggle_Kids1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titlestoggle_Kids1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titlestoggle_kids1(inputs)
	if (locale === "es") return es_family_titlestoggle_kids1(inputs)
	if (locale === "fr") return fr_family_titlestoggle_kids1(inputs)
	return ar_family_titlestoggle_kids1(inputs)
});
export { family_titlestoggle_kids1 as "family.titlesToggle.kids" }