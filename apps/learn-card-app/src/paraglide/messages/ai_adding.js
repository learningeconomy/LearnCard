/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_AddingInputs */

const en_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adding...`)
};

const es_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregando...`)
};

const de_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird hinzugefügt...`)
};

const ar_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإضافة...`)
};

const fr_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajout...`)
};

const ko_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`추가 중...`)
};

/**
* | output |
* | --- |
* | "Adding..." |
*
* @param {Ai_AddingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_adding = /** @type {((inputs?: Ai_AddingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_AddingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_adding(inputs)
	if (locale === "es") return es_ai_adding(inputs)
	if (locale === "de") return de_ai_adding(inputs)
	if (locale === "ar") return ar_ai_adding(inputs)
	if (locale === "fr") return fr_ai_adding(inputs)
	return ko_ai_adding(inputs)
});
export { ai_adding as "ai.adding" }