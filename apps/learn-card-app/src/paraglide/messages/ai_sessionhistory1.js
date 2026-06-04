/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Sessionhistory1Inputs */

const en_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session History`)
};

const es_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial de sesiones`)
};

const de_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sitzungsverlauf`)
};

const ar_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الجلسات`)
};

const fr_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique des sessions`)
};

const ko_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`세션 기록`)
};

/**
* | output |
* | --- |
* | "Session History" |
*
* @param {Ai_Sessionhistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_sessionhistory1 = /** @type {((inputs?: Ai_Sessionhistory1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Sessionhistory1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_sessionhistory1(inputs)
	if (locale === "es") return es_ai_sessionhistory1(inputs)
	if (locale === "de") return de_ai_sessionhistory1(inputs)
	if (locale === "ar") return ar_ai_sessionhistory1(inputs)
	if (locale === "fr") return fr_ai_sessionhistory1(inputs)
	return ko_ai_sessionhistory1(inputs)
});
export { ai_sessionhistory1 as "ai.sessionHistory" }