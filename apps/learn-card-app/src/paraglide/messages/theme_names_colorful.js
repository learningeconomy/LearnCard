/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Names_ColorfulInputs */

const en_theme_names_colorful = /** @type {(inputs: Theme_Names_ColorfulInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colorful`)
};

const es_theme_names_colorful = /** @type {(inputs: Theme_Names_ColorfulInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colorful`)
};

const fr_theme_names_colorful = /** @type {(inputs: Theme_Names_ColorfulInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colorful`)
};

const ar_theme_names_colorful = /** @type {(inputs: Theme_Names_ColorfulInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colorful`)
};

/**
* | output |
* | --- |
* | "Colorful" |
*
* @param {Theme_Names_ColorfulInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_names_colorful = /** @type {((inputs?: Theme_Names_ColorfulInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Names_ColorfulInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_names_colorful(inputs)
	if (locale === "es") return es_theme_names_colorful(inputs)
	if (locale === "fr") return fr_theme_names_colorful(inputs)
	return ar_theme_names_colorful(inputs)
});
export { theme_names_colorful as "theme.names.colorful" }