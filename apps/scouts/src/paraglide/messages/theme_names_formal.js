/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Names_FormalInputs */

const en_theme_names_formal = /** @type {(inputs: Theme_Names_FormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formal`)
};

const es_theme_names_formal = /** @type {(inputs: Theme_Names_FormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formal`)
};

const fr_theme_names_formal = /** @type {(inputs: Theme_Names_FormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formel`)
};

const ar_theme_names_formal = /** @type {(inputs: Theme_Names_FormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formal`)
};

/**
* | output |
* | --- |
* | "Formal" |
*
* @param {Theme_Names_FormalInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_names_formal = /** @type {((inputs?: Theme_Names_FormalInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Names_FormalInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_names_formal(inputs)
	if (locale === "es") return es_theme_names_formal(inputs)
	if (locale === "fr") return fr_theme_names_formal(inputs)
	return ar_theme_names_formal(inputs)
});
export { theme_names_formal as "theme.names.formal" }