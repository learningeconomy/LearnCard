/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Personalizemyai2Inputs */

const en_ai_personalizemyai2 = /** @type {(inputs: Ai_Personalizemyai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalize My AI`)
};

const es_ai_personalizemyai2 = /** @type {(inputs: Ai_Personalizemyai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personaliza mi IA`)
};

const fr_ai_personalizemyai2 = /** @type {(inputs: Ai_Personalizemyai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnaliser mon IA`)
};

const ar_ai_personalizemyai2 = /** @type {(inputs: Ai_Personalizemyai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص الذكاء الاصطناعي الخاص بي`)
};

/**
* | output |
* | --- |
* | "Personalize My AI" |
*
* @param {Ai_Personalizemyai2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_personalizemyai2 = /** @type {((inputs?: Ai_Personalizemyai2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Personalizemyai2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_personalizemyai2(inputs)
	if (locale === "es") return es_ai_personalizemyai2(inputs)
	if (locale === "fr") return fr_ai_personalizemyai2(inputs)
	return ar_ai_personalizemyai2(inputs)
});
export { ai_personalizemyai2 as "ai.personalizeMyAi" }