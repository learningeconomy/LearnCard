/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Logintorequest2Inputs */

const en_ai_logintorequest2 = /** @type {(inputs: Ai_Logintorequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login to Request`)
};

const es_ai_logintorequest2 = /** @type {(inputs: Ai_Logintorequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para solicitar`)
};

const de_ai_logintorequest2 = /** @type {(inputs: Ai_Logintorequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anmelden zum Anfordern`)
};

const ar_ai_logintorequest2 = /** @type {(inputs: Ai_Logintorequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الدخول للطلب`)
};

const fr_ai_logintorequest2 = /** @type {(inputs: Ai_Logintorequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous pour demander`)
};

const ko_ai_logintorequest2 = /** @type {(inputs: Ai_Logintorequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`요청하려면 로그인하세요`)
};

/**
* | output |
* | --- |
* | "Login to Request" |
*
* @param {Ai_Logintorequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_logintorequest2 = /** @type {((inputs?: Ai_Logintorequest2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Logintorequest2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_logintorequest2(inputs)
	if (locale === "es") return es_ai_logintorequest2(inputs)
	if (locale === "de") return de_ai_logintorequest2(inputs)
	if (locale === "ar") return ar_ai_logintorequest2(inputs)
	if (locale === "fr") return fr_ai_logintorequest2(inputs)
	return ko_ai_logintorequest2(inputs)
});
export { ai_logintorequest2 as "ai.loginToRequest" }