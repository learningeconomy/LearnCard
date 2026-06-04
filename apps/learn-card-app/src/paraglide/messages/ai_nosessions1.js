/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Nosessions1Inputs */

const en_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No sessions yet`)
};

const es_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay sesiones`)
};

const de_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Sitzungen`)
};

const ar_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد جلسات بعد`)
};

const fr_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune session pour le moment`)
};

const ko_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 세션 없음`)
};

/**
* | output |
* | --- |
* | "No sessions yet" |
*
* @param {Ai_Nosessions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_nosessions1 = /** @type {((inputs?: Ai_Nosessions1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Nosessions1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_nosessions1(inputs)
	if (locale === "es") return es_ai_nosessions1(inputs)
	if (locale === "de") return de_ai_nosessions1(inputs)
	if (locale === "ar") return ar_ai_nosessions1(inputs)
	if (locale === "fr") return fr_ai_nosessions1(inputs)
	return ko_ai_nosessions1(inputs)
});
export { ai_nosessions1 as "ai.noSessions" }