/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Names_VetpassInputs */

const en_theme_names_vetpass = /** @type {(inputs: Theme_Names_VetpassInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`VetPass`)
};

const es_theme_names_vetpass = /** @type {(inputs: Theme_Names_VetpassInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`VetPass`)
};

const de_theme_names_vetpass = /** @type {(inputs: Theme_Names_VetpassInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`VetPass`)
};

const ar_theme_names_vetpass = /** @type {(inputs: Theme_Names_VetpassInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`VetPass`)
};

/**
* | output |
* | --- |
* | "VetPass" |
*
* @param {Theme_Names_VetpassInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_names_vetpass = /** @type {((inputs?: Theme_Names_VetpassInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Names_VetpassInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_names_vetpass(inputs)
	if (locale === "es") return es_theme_names_vetpass(inputs)
	if (locale === "de") return de_theme_names_vetpass(inputs)
	return ar_theme_names_vetpass(inputs)
});
export { theme_names_vetpass as "theme.names.vetpass" }