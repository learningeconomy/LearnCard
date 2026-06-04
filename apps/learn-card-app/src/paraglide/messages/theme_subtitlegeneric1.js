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

const de_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wähle deinen bevorzugten visuellen Stil.`)
};

const ar_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر أسلوبك المرئي المفضل.`)
};

const fr_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez votre style visuel préféré.`)
};

const ko_theme_subtitlegeneric1 = /** @type {(inputs: Theme_Subtitlegeneric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`원하는 시각적 스타일을 선택하세요.`)
};

/**
* | output |
* | --- |
* | "Choose your preferred visual style." |
*
* @param {Theme_Subtitlegeneric1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const theme_subtitlegeneric1 = /** @type {((inputs?: Theme_Subtitlegeneric1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Subtitlegeneric1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_subtitlegeneric1(inputs)
	if (locale === "es") return es_theme_subtitlegeneric1(inputs)
	if (locale === "de") return de_theme_subtitlegeneric1(inputs)
	if (locale === "ar") return ar_theme_subtitlegeneric1(inputs)
	if (locale === "fr") return fr_theme_subtitlegeneric1(inputs)
	return ko_theme_subtitlegeneric1(inputs)
});
export { theme_subtitlegeneric1 as "theme.subtitleGeneric" }