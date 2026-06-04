/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Language_KoreanInputs */

const en_language_korean = /** @type {(inputs: Language_KoreanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`한국어`)
};

const es_language_korean = /** @type {(inputs: Language_KoreanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`한국어`)
};

const de_language_korean = /** @type {(inputs: Language_KoreanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`한국어`)
};

const ar_language_korean = /** @type {(inputs: Language_KoreanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`한국어`)
};

const fr_language_korean = /** @type {(inputs: Language_KoreanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`한국어`)
};

const ko_language_korean = /** @type {(inputs: Language_KoreanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`한국어`)
};

/**
* | output |
* | --- |
* | "한국어" |
*
* @param {Language_KoreanInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const language_korean = /** @type {((inputs?: Language_KoreanInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_KoreanInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_korean(inputs)
	if (locale === "es") return es_language_korean(inputs)
	if (locale === "de") return de_language_korean(inputs)
	if (locale === "ar") return ar_language_korean(inputs)
	if (locale === "fr") return fr_language_korean(inputs)
	return ko_language_korean(inputs)
});
export { language_korean as "language.korean" }