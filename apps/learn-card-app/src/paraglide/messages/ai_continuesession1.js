/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Continuesession1Inputs */

const en_ai_continuesession1 = /** @type {(inputs: Ai_Continuesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue`)
};

const es_ai_continuesession1 = /** @type {(inputs: Ai_Continuesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar`)
};

const de_ai_continuesession1 = /** @type {(inputs: Ai_Continuesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fortsetzen`)
};

const ar_ai_continuesession1 = /** @type {(inputs: Ai_Continuesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة`)
};

const fr_ai_continuesession1 = /** @type {(inputs: Ai_Continuesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer`)
};

const ko_ai_continuesession1 = /** @type {(inputs: Ai_Continuesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계속`)
};

/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Ai_Continuesession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_continuesession1 = /** @type {((inputs?: Ai_Continuesession1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Continuesession1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_continuesession1(inputs)
	if (locale === "es") return es_ai_continuesession1(inputs)
	if (locale === "de") return de_ai_continuesession1(inputs)
	if (locale === "ar") return ar_ai_continuesession1(inputs)
	if (locale === "fr") return fr_ai_continuesession1(inputs)
	return ko_ai_continuesession1(inputs)
});
export { ai_continuesession1 as "ai.continueSession" }