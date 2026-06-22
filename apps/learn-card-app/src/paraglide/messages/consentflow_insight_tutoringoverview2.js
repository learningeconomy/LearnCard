/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Insight_Tutoringoverview2Inputs */

const en_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brief overviews of your tutoring conversations`)
};

const es_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resúmenes breves de tus conversaciones de tutoría`)
};

const fr_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçus de vos conversations de tutorat`)
};

const ar_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخصات موجزة لمحادثات الدروس الخصوصية`)
};

/**
* | output |
* | --- |
* | "Brief overviews of your tutoring conversations" |
*
* @param {Consentflow_Insight_Tutoringoverview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_insight_tutoringoverview2 = /** @type {((inputs?: Consentflow_Insight_Tutoringoverview2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Insight_Tutoringoverview2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_insight_tutoringoverview2(inputs)
	if (locale === "es") return es_consentflow_insight_tutoringoverview2(inputs)
	if (locale === "fr") return fr_consentflow_insight_tutoringoverview2(inputs)
	return ar_consentflow_insight_tutoringoverview2(inputs)
});
export { consentflow_insight_tutoringoverview2 as "consentFlow.insight.tutoringOverview" }