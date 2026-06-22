/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Insight_Progressevaluations2Inputs */

const en_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evaluations of your progress during tutoring`)
};

const es_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evaluaciones de tu progreso durante la tutoría`)
};

const fr_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Évaluations de vos progrès pendant le tutorat`)
};

const ar_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقييمات تقدمك خلال الدروس الخصوصية`)
};

/**
* | output |
* | --- |
* | "Evaluations of your progress during tutoring" |
*
* @param {Consentflow_Insight_Progressevaluations2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_insight_progressevaluations2 = /** @type {((inputs?: Consentflow_Insight_Progressevaluations2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Insight_Progressevaluations2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_insight_progressevaluations2(inputs)
	if (locale === "es") return es_consentflow_insight_progressevaluations2(inputs)
	if (locale === "fr") return fr_consentflow_insight_progressevaluations2(inputs)
	return ar_consentflow_insight_progressevaluations2(inputs)
});
export { consentflow_insight_progressevaluations2 as "consentFlow.insight.progressEvaluations" }