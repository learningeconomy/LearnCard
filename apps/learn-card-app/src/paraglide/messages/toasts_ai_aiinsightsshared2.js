/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Ai_Aiinsightsshared2Inputs */

const en_toasts_ai_aiinsightsshared2 = /** @type {(inputs: Toasts_Ai_Aiinsightsshared2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights shared!`)
};

const es_toasts_ai_aiinsightsshared2 = /** @type {(inputs: Toasts_Ai_Aiinsightsshared2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Insights compartidos!`)
};

const fr_toasts_ai_aiinsightsshared2 = /** @type {(inputs: Toasts_Ai_Aiinsightsshared2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights partagés !`)
};

const ar_toasts_ai_aiinsightsshared2 = /** @type {(inputs: Toasts_Ai_Aiinsightsshared2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`!تمت مشاركة الرؤى`)
};

/**
* | output |
* | --- |
* | "Insights shared!" |
*
* @param {Toasts_Ai_Aiinsightsshared2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_ai_aiinsightsshared2 = /** @type {((inputs?: Toasts_Ai_Aiinsightsshared2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Ai_Aiinsightsshared2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_ai_aiinsightsshared2(inputs)
	if (locale === "es") return es_toasts_ai_aiinsightsshared2(inputs)
	if (locale === "fr") return fr_toasts_ai_aiinsightsshared2(inputs)
	return ar_toasts_ai_aiinsightsshared2(inputs)
});
export { toasts_ai_aiinsightsshared2 as "toasts.ai.aiInsightsShared" }