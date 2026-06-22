/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Nosessionsfortopic3Inputs */

const en_ai_nosessionsfortopic3 = /** @type {(inputs: Ai_Nosessionsfortopic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No sessions for this topic`)
};

const es_ai_nosessionsfortopic3 = /** @type {(inputs: Ai_Nosessionsfortopic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin sesiones para este tema`)
};

const fr_ai_nosessionsfortopic3 = /** @type {(inputs: Ai_Nosessionsfortopic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune session pour ce sujet`)
};

const ar_ai_nosessionsfortopic3 = /** @type {(inputs: Ai_Nosessionsfortopic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد جلسات لهذا الموضوع`)
};

/**
* | output |
* | --- |
* | "No sessions for this topic" |
*
* @param {Ai_Nosessionsfortopic3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_nosessionsfortopic3 = /** @type {((inputs?: Ai_Nosessionsfortopic3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Nosessionsfortopic3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_nosessionsfortopic3(inputs)
	if (locale === "es") return es_ai_nosessionsfortopic3(inputs)
	if (locale === "fr") return fr_ai_nosessionsfortopic3(inputs)
	return ar_ai_nosessionsfortopic3(inputs)
});
export { ai_nosessionsfortopic3 as "ai.noSessionsForTopic" }