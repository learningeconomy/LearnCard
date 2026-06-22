/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Insight_Sessionoverviews2Inputs */

const en_consentflow_insight_sessionoverviews2 = /** @type {(inputs: Consentflow_Insight_Sessionoverviews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Written overviews of your AI tutoring sessions`)
};

const es_consentflow_insight_sessionoverviews2 = /** @type {(inputs: Consentflow_Insight_Sessionoverviews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resúmenes de tus sesiones de tutoría con IA`)
};

const fr_consentflow_insight_sessionoverviews2 = /** @type {(inputs: Consentflow_Insight_Sessionoverviews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçus de vos sessions de tutorat IA`)
};

const ar_consentflow_insight_sessionoverviews2 = /** @type {(inputs: Consentflow_Insight_Sessionoverviews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخصات مكتوبة لجلسات الدروس الخصوصية بالذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "Written overviews of your AI tutoring sessions" |
*
* @param {Consentflow_Insight_Sessionoverviews2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_insight_sessionoverviews2 = /** @type {((inputs?: Consentflow_Insight_Sessionoverviews2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Insight_Sessionoverviews2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_insight_sessionoverviews2(inputs)
	if (locale === "es") return es_consentflow_insight_sessionoverviews2(inputs)
	if (locale === "fr") return fr_consentflow_insight_sessionoverviews2(inputs)
	return ar_consentflow_insight_sessionoverviews2(inputs)
});
export { consentflow_insight_sessionoverviews2 as "consentFlow.insight.sessionOverviews" }