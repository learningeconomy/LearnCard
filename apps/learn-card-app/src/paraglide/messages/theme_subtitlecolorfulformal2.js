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

const de_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wechsle zwischen unserem bunten Erlebnis und einem klassischen, formellen Stil.`)
};

const ar_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدّل بين تجربتنا الملونة وأسلوب كلاسيكي رسمي.`)
};

const fr_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basculez entre notre expérience colorée signature et un style classique et formel.`)
};

const ko_theme_subtitlecolorfulformal2 = /** @type {(inputs: Theme_Subtitlecolorfulformal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시그니처 컬러풀 경험과 클래식 포멀 스타일 사이를 전환하세요.`)
};

/**
* | output |
* | --- |
* | "Switch between our signature, colorful experience and a classic, formal style." |
*
* @param {Theme_Subtitlecolorfulformal2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const theme_subtitlecolorfulformal2 = /** @type {((inputs?: Theme_Subtitlecolorfulformal2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Theme_Subtitlecolorfulformal2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_theme_subtitlecolorfulformal2(inputs)
	if (locale === "es") return es_theme_subtitlecolorfulformal2(inputs)
	if (locale === "de") return de_theme_subtitlecolorfulformal2(inputs)
	if (locale === "ar") return ar_theme_subtitlecolorfulformal2(inputs)
	if (locale === "fr") return fr_theme_subtitlecolorfulformal2(inputs)
	return ko_theme_subtitlecolorfulformal2(inputs)
});
export { theme_subtitlecolorfulformal2 as "theme.subtitleColorfulFormal" }