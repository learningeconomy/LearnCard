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

const fr_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajout...`)
};

const ar_ai_adding = /** @type {(inputs: Ai_AddingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإضافة...`)
};

/**
* | output |
* | --- |
* | "Adding..." |
*
* @param {Ai_AddingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_adding = /** @type {((inputs?: Ai_AddingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_AddingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_adding(inputs)
	if (locale === "es") return es_ai_adding(inputs)
	if (locale === "fr") return fr_ai_adding(inputs)
	return ar_ai_adding(inputs)
});
export { ai_adding as "ai.adding" }