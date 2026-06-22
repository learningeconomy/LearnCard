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

const fr_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de résoudre le titre du parcours`)
};

const ar_ai_failedtoresolve2 = /** @type {(inputs: Ai_Failedtoresolve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حل شهادة المسار`)
};

/**
* | output |
* | --- |
* | "Failed to resolve pathway credential" |
*
* @param {Ai_Failedtoresolve2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_failedtoresolve2 = /** @type {((inputs?: Ai_Failedtoresolve2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Failedtoresolve2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_failedtoresolve2(inputs)
	if (locale === "es") return es_ai_failedtoresolve2(inputs)
	if (locale === "fr") return fr_ai_failedtoresolve2(inputs)
	return ar_ai_failedtoresolve2(inputs)
});
export { ai_failedtoresolve2 as "ai.failedToResolve" }