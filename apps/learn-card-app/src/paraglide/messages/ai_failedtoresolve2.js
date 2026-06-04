/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Failedtoresolve2Inputs */

const en_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to resolve pathway credential`)
};

const es_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al resolver la credencial del camino`)
};

const de_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pfad-Berechtigung konnte nicht aufgelöst werden`)
};

const ar_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حل شهادة المسار`)
};

const fr_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de résoudre le titre du parcours`)
};

const ko_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경로 자격증명 해결 실패`)
};

/**
* | output |
* | --- |
* | "Failed to resolve pathway credential" |
*
* @param {Ai_Failedtoresolve2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_failedtoresolve2 = /** @type {((inputs?: Ai_Failedtoresolve2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Failedtoresolve2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_failedtoresolve2(inputs)
	if (locale === "es") return es_ai_failedtoresolve2(inputs)
	if (locale === "de") return de_ai_failedtoresolve2(inputs)
	if (locale === "ar") return ar_ai_failedtoresolve2(inputs)
	if (locale === "fr") return fr_ai_failedtoresolve2(inputs)
	return ko_ai_failedtoresolve2(inputs)
});
export { ai_failedtoresolve2 as "ai.failedToResolve" }