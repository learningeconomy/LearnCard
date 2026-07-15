/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Neutralmode1Inputs */

const en_theme_neutralmode1 = /** @type {(inputs: Theme_Neutralmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neutral Mode`)
};

const es_theme_neutralmode1 = /** @type {(inputs: Theme_Neutralmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modo neutro`)
};

const fr_theme_neutralmode1 = /** @type {(inputs: Theme_Neutralmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mode neutre`)
};

const ar_theme_neutralmode1 = /** @type {(inputs: Theme_Neutralmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوضع المحايد`)
};

/**
* | output |
* | --- |
* | "Neutral Mode" |
*
* @param {Theme_Neutralmode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_neutralmode1 = /** @type {((inputs?: Theme_Neutralmode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Neutralmode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_neutralmode1(inputs)
	if (locale === "es") return es_theme_neutralmode1(inputs)
	if (locale === "fr") return fr_theme_neutralmode1(inputs)
	return ar_theme_neutralmode1(inputs)
});
export { theme_neutralmode1 as "theme.neutralMode" }