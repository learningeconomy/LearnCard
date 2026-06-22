/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Noinsightssharedview4Inputs */

const en_aiinsights_noinsightssharedview4 = /** @type {(inputs: Aiinsights_Noinsightssharedview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This learner hasn't generated any AI Insights yet.`)
};

const es_aiinsights_noinsightssharedview4 = /** @type {(inputs: Aiinsights_Noinsightssharedview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este estudiante aún no ha generado Insights de IA.`)
};

const fr_aiinsights_noinsightssharedview4 = /** @type {(inputs: Aiinsights_Noinsightssharedview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cet apprenant n'a pas encore généré d'Insights IA.`)
};

const ar_aiinsights_noinsightssharedview4 = /** @type {(inputs: Aiinsights_Noinsightssharedview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم ينشئ هذا المتعلم أي رؤى ذكاء اصطناعي بعد.`)
};

/**
* | output |
* | --- |
* | "This learner hasn't generated any AI Insights yet." |
*
* @param {Aiinsights_Noinsightssharedview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_noinsightssharedview4 = /** @type {((inputs?: Aiinsights_Noinsightssharedview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Noinsightssharedview4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_noinsightssharedview4(inputs)
	if (locale === "es") return es_aiinsights_noinsightssharedview4(inputs)
	if (locale === "fr") return fr_aiinsights_noinsightssharedview4(inputs)
	return ar_aiinsights_noinsightssharedview4(inputs)
});
export { aiinsights_noinsightssharedview4 as "aiInsights.noInsightsSharedView" }