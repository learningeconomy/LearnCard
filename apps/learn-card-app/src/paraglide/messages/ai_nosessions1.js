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

const fr_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune session pour le moment`)
};

const ar_ai_nosessions1 = /** @type {(inputs: Ai_Nosessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد جلسات بعد`)
};

/**
* | output |
* | --- |
* | "No sessions yet" |
*
* @param {Ai_Nosessions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_nosessions1 = /** @type {((inputs?: Ai_Nosessions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Nosessions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_nosessions1(inputs)
	if (locale === "es") return es_ai_nosessions1(inputs)
	if (locale === "fr") return fr_ai_nosessions1(inputs)
	return ar_ai_nosessions1(inputs)
});
export { ai_nosessions1 as "ai.noSessions" }