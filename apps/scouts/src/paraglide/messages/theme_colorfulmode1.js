/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Colorfulmode1Inputs */

const en_theme_colorfulmode1 = /** @type {(inputs: Theme_Colorfulmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colorful Mode`)
};

const es_theme_colorfulmode1 = /** @type {(inputs: Theme_Colorfulmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modo colorido`)
};

const fr_theme_colorfulmode1 = /** @type {(inputs: Theme_Colorfulmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mode coloré`)
};

const ar_theme_colorfulmode1 = /** @type {(inputs: Theme_Colorfulmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوضع الملوّن`)
};

/**
* | output |
* | --- |
* | "Colorful Mode" |
*
* @param {Theme_Colorfulmode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_colorfulmode1 = /** @type {((inputs?: Theme_Colorfulmode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Colorfulmode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_colorfulmode1(inputs)
	if (locale === "es") return es_theme_colorfulmode1(inputs)
	if (locale === "fr") return fr_theme_colorfulmode1(inputs)
	return ar_theme_colorfulmode1(inputs)
});
export { theme_colorfulmode1 as "theme.colorfulMode" }