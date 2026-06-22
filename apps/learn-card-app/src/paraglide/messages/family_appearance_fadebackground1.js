/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Appearance_Fadebackground1Inputs */

const en_family_appearance_fadebackground1 = /** @type {(inputs: Family_Appearance_Fadebackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fade background`)
};

const es_family_appearance_fadebackground1 = /** @type {(inputs: Family_Appearance_Fadebackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atenuar fondo`)
};

const fr_family_appearance_fadebackground1 = /** @type {(inputs: Family_Appearance_Fadebackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atténuer le fond`)
};

const ar_family_appearance_fadebackground1 = /** @type {(inputs: Family_Appearance_Fadebackground1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعتيم الخلفية`)
};

/**
* | output |
* | --- |
* | "Fade background" |
*
* @param {Family_Appearance_Fadebackground1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_appearance_fadebackground1 = /** @type {((inputs?: Family_Appearance_Fadebackground1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Appearance_Fadebackground1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_appearance_fadebackground1(inputs)
	if (locale === "es") return es_family_appearance_fadebackground1(inputs)
	if (locale === "fr") return fr_family_appearance_fadebackground1(inputs)
	return ar_family_appearance_fadebackground1(inputs)
});
export { family_appearance_fadebackground1 as "family.appearance.fadeBackground" }