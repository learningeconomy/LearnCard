/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Launchingsession1Inputs */

const en_ai_launchingsession1 = /** @type {(inputs: Ai_Launchingsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launching your session...`)
};

const es_ai_launchingsession1 = /** @type {(inputs: Ai_Launchingsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciando tu sesión...`)
};

const fr_ai_launchingsession1 = /** @type {(inputs: Ai_Launchingsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancement de votre session...`)
};

const ar_ai_launchingsession1 = /** @type {(inputs: Ai_Launchingsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تشغيل جلستك...`)
};

/**
* | output |
* | --- |
* | "Launching your session..." |
*
* @param {Ai_Launchingsession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_launchingsession1 = /** @type {((inputs?: Ai_Launchingsession1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Launchingsession1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_launchingsession1(inputs)
	if (locale === "es") return es_ai_launchingsession1(inputs)
	if (locale === "fr") return fr_ai_launchingsession1(inputs)
	return ar_ai_launchingsession1(inputs)
});
export { ai_launchingsession1 as "ai.launchingSession" }