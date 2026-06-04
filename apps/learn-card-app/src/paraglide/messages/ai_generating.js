/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_GeneratingInputs */

const en_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating...`)
};

const es_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando...`)
};

const de_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird generiert...`)
};

const ar_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التوليد...`)
};

const fr_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération...`)
};

const ko_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`생성 중...`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Ai_GeneratingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_generating = /** @type {((inputs?: Ai_GeneratingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_GeneratingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_generating(inputs)
	if (locale === "es") return es_ai_generating(inputs)
	if (locale === "de") return de_ai_generating(inputs)
	if (locale === "ar") return ar_ai_generating(inputs)
	if (locale === "fr") return fr_ai_generating(inputs)
	return ko_ai_generating(inputs)
});
export { ai_generating as "ai.generating" }