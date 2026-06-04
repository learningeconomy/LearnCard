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

const de_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bewertungen deines Fortschritts während der Nachhilfe`)
};

const ar_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقييمات تقدمك خلال الدروس الخصوصية`)
};

const fr_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Évaluations de vos progrès pendant le tutorat`)
};

const ko_consentflow_insight_progressevaluations2 = /** @type {(inputs: Consentflow_Insight_Progressevaluations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`튜터링 중 귀하의 진행 상황 평가`)
};

/**
* | output |
* | --- |
* | "Evaluations of your progress during tutoring" |
*
* @param {Consentflow_Insight_Progressevaluations2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_insight_progressevaluations2 = /** @type {((inputs?: Consentflow_Insight_Progressevaluations2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Insight_Progressevaluations2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_insight_progressevaluations2(inputs)
	if (locale === "es") return es_consentflow_insight_progressevaluations2(inputs)
	if (locale === "de") return de_consentflow_insight_progressevaluations2(inputs)
	if (locale === "ar") return ar_consentflow_insight_progressevaluations2(inputs)
	if (locale === "fr") return fr_consentflow_insight_progressevaluations2(inputs)
	return ko_consentflow_insight_progressevaluations2(inputs)
});
export { consentflow_insight_progressevaluations2 as "consentFlow.insight.progressEvaluations" }