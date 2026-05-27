/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_TitleInputs */

const en_theme_title = /** @type {(inputs: Theme_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose Your Theme`)
};

const es_theme_title = /** @type {(inputs: Theme_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige Tu Tema`)
};

const de_theme_title = /** @type {(inputs: Theme_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wähle Dein Theme`)
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
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_title = /** @type {((inputs?: Theme_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_TitleInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_title(inputs)
	if (locale === "es") return es_theme_title(inputs)
	if (locale === "de") return de_theme_title(inputs)
	return ar_theme_title(inputs)
});
export { theme_title as "theme.title" }