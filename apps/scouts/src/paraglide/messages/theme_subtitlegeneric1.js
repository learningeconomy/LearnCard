/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Subtitlegeneric1Inputs */

const en_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose your preferred visual style.`)
};

const es_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige tu estilo visual preferido.`)
};

const fr_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez votre style visuel préféré.`)
};

const ar_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر أسلوبك المرئي المفضل.`)
};

/**
* | output |
* | --- |
* | "Choose your preferred visual style." |
*
* @param {Theme_Subtitlegeneric1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_subtitlegeneric1 = /** @type {((inputs?: Theme_Subtitlegeneric1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Subtitlegeneric1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_subtitlegeneric1(inputs)
	if (locale === "es") return es_theme_subtitlegeneric1(inputs)
	if (locale === "fr") return fr_theme_subtitlegeneric1(inputs)
	return ar_theme_subtitlegeneric1(inputs)
});
export { theme_subtitlegeneric1 as "theme.subtitleGeneric" }