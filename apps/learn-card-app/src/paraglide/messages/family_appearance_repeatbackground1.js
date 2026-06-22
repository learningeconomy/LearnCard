/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Appearance_Repeatbackground1Inputs */

const en_family_appearance_repeatbackground1 = /** @type {(inputs: Family_Appearance_Repeatbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repeat background`)
};

const es_family_appearance_repeatbackground1 = /** @type {(inputs: Family_Appearance_Repeatbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repetir fondo`)
};

const fr_family_appearance_repeatbackground1 = /** @type {(inputs: Family_Appearance_Repeatbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Répéter le fond`)
};

const ar_family_appearance_repeatbackground1 = /** @type {(inputs: Family_Appearance_Repeatbackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكرار الخلفية`)
};

/**
* | output |
* | --- |
* | "Repeat background" |
*
* @param {Family_Appearance_Repeatbackground1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_appearance_repeatbackground1 = /** @type {((inputs?: Family_Appearance_Repeatbackground1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Appearance_Repeatbackground1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_appearance_repeatbackground1(inputs)
	if (locale === "es") return es_family_appearance_repeatbackground1(inputs)
	if (locale === "fr") return fr_family_appearance_repeatbackground1(inputs)
	return ar_family_appearance_repeatbackground1(inputs)
});
export { family_appearance_repeatbackground1 as "family.appearance.repeatBackground" }