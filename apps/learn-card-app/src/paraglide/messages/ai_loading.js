/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_LoadingInputs */

const en_ai_loading = /** @type {(inputs: Ai_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_ai_loading = /** @type {(inputs: Ai_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const de_ai_loading = /** @type {(inputs: Ai_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Laden...`)
};

const ar_ai_loading = /** @type {(inputs: Ai_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحميل...`)
};

const fr_ai_loading = /** @type {(inputs: Ai_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ko_ai_loading = /** @type {(inputs: Ai_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로딩...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Ai_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_loading = /** @type {((inputs?: Ai_LoadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_LoadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_loading(inputs)
	if (locale === "es") return es_ai_loading(inputs)
	if (locale === "de") return de_ai_loading(inputs)
	if (locale === "ar") return ar_ai_loading(inputs)
	if (locale === "fr") return fr_ai_loading(inputs)
	return ko_ai_loading(inputs)
});
export { ai_loading as "ai.loading" }