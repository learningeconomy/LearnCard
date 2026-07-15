/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Subtitlecolorfulformal2Inputs */

const en_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch between our signature, colorful experience and a classic, formal style.`)
};

const es_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambia entre nuestra experiencia colorida y un estilo clásico y formal.`)
};

const fr_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basculez entre notre expérience colorée signature et un style classique et formel.`)
};

const ar_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدّل بين تجربتنا الملونة وأسلوب كلاسيكي رسمي.`)
};

/**
* | output |
* | --- |
* | "Switch between our signature, colorful experience and a classic, formal style." |
*
* @param {Theme_Subtitlecolorfulformal2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_subtitlecolorfulformal2 = /** @type {((inputs?: Theme_Subtitlecolorfulformal2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Subtitlecolorfulformal2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_subtitlecolorfulformal2(inputs)
	if (locale === "es") return es_theme_subtitlecolorfulformal2(inputs)
	if (locale === "fr") return fr_theme_subtitlecolorfulformal2(inputs)
	return ar_theme_subtitlecolorfulformal2(inputs)
});
export { theme_subtitlecolorfulformal2 as "theme.subtitleColorfulFormal" }