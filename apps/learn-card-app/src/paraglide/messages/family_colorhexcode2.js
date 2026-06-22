/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Colorhexcode2Inputs */

const en_family_colorhexcode2 = /** @type {(inputs: Family_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color Hex Code`)
};

const es_family_colorhexcode2 = /** @type {(inputs: Family_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código de color hex`)
};

const fr_family_colorhexcode2 = /** @type {(inputs: Family_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code couleur hex`)
};

const ar_family_colorhexcode2 = /** @type {(inputs: Family_Colorhexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز اللون السداسي`)
};

/**
* | output |
* | --- |
* | "Color Hex Code" |
*
* @param {Family_Colorhexcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_colorhexcode2 = /** @type {((inputs?: Family_Colorhexcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Colorhexcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_colorhexcode2(inputs)
	if (locale === "es") return es_family_colorhexcode2(inputs)
	if (locale === "fr") return fr_family_colorhexcode2(inputs)
	return ar_family_colorhexcode2(inputs)
});
export { family_colorhexcode2 as "family.colorHexCode" }