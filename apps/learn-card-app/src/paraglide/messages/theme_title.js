/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_TitleInputs */

const en_theme_title = /** @type {(inputs: Theme_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose Your Theme`)
};

const es_theme_title = /** @type {(inputs: Theme_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige tu tema`)
};

const fr_theme_title = /** @type {(inputs: Theme_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez votre thème`)
};

const ar_theme_title = /** @type {(inputs: Theme_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مظهرك`)
};

/**
* | output |
* | --- |
* | "Choose Your Theme" |
*
* @param {Theme_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_title = /** @type {((inputs?: Theme_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_title(inputs)
	if (locale === "es") return es_theme_title(inputs)
	if (locale === "fr") return fr_theme_title(inputs)
	return ar_theme_title(inputs)
});
export { theme_title as "theme.title" }