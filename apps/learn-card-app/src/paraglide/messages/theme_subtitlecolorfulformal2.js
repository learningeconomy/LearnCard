/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Theme_Subtitlecolorfulformal2Inputs */

const en_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch between our signature, colorful experience and a classic, formal style.`)
};

const es_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alterna entre nuestra experiencia colorida característica y un estilo clásico y formal.`)
};

const de_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wechsle zwischen unserem charakteristischen, bunten Erlebnis und einem klassischen, formellen Stil.`)
};

const ar_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدّل بين تجربتنا المميزة الملوّنة وأسلوب كلاسيكي رسمي.`)
};

/**
* | output |
* | --- |
* | "Switch between our signature, colorful experience and a classic, formal style." |
*
* @param {Theme_Subtitlecolorfulformal2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const theme_subtitlecolorfulformal2 = /** @type {((inputs?: Theme_Subtitlecolorfulformal2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Subtitlecolorfulformal2Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_subtitlecolorfulformal2(inputs)
	if (locale === "es") return es_theme_subtitlecolorfulformal2(inputs)
	if (locale === "de") return de_theme_subtitlecolorfulformal2(inputs)
	return ar_theme_subtitlecolorfulformal2(inputs)
});
export { theme_subtitlecolorfulformal2 as "theme.subtitleColorfulFormal" }