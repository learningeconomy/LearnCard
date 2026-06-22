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

const fr_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique des sessions`)
};

const ar_ai_sessionhistory1 = /** @type {(inputs: Ai_Sessionhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الجلسات`)
};

/**
* | output |
* | --- |
* | "Session History" |
*
* @param {Ai_Sessionhistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_sessionhistory1 = /** @type {((inputs?: Ai_Sessionhistory1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Sessionhistory1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_sessionhistory1(inputs)
	if (locale === "es") return es_ai_sessionhistory1(inputs)
	if (locale === "fr") return fr_ai_sessionhistory1(inputs)
	return ar_ai_sessionhistory1(inputs)
});
export { ai_sessionhistory1 as "ai.sessionHistory" }