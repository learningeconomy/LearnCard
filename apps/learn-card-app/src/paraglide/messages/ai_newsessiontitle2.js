/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Newsessiontitle2Inputs */

const en_ai_newsessiontitle2 = /** @type {(inputs: Ai_Newsessiontitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start a new session`)
};

const es_ai_newsessiontitle2 = /** @type {(inputs: Ai_Newsessiontitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar una nueva sesión`)
};

const de_ai_newsessiontitle2 = /** @type {(inputs: Ai_Newsessiontitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue Sitzung starten`)
};

const ar_ai_newsessiontitle2 = /** @type {(inputs: Ai_Newsessiontitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدء جلسة جديدة`)
};

const fr_ai_newsessiontitle2 = /** @type {(inputs: Ai_Newsessiontitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Démarrer une nouvelle session`)
};

const ko_ai_newsessiontitle2 = /** @type {(inputs: Ai_Newsessiontitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 세션 시작`)
};

/**
* | output |
* | --- |
* | "Start a new session" |
*
* @param {Ai_Newsessiontitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_newsessiontitle2 = /** @type {((inputs?: Ai_Newsessiontitle2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Newsessiontitle2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_newsessiontitle2(inputs)
	if (locale === "es") return es_ai_newsessiontitle2(inputs)
	if (locale === "de") return de_ai_newsessiontitle2(inputs)
	if (locale === "ar") return ar_ai_newsessiontitle2(inputs)
	if (locale === "fr") return fr_ai_newsessiontitle2(inputs)
	return ko_ai_newsessiontitle2(inputs)
});
export { ai_newsessiontitle2 as "ai.newSessionTitle" }