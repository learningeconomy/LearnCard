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

const de_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kurze Übersichten deiner Nachhilfegespräche`)
};

const ar_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخصات موجزة لمحادثات الدروس الخصوصية`)
};

const fr_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçus de vos conversations de tutorat`)
};

const ko_consentflow_insight_tutoringoverview2 = /** @type {(inputs: Consentflow_Insight_Tutoringoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`튜터링 대화에 대한 간략한 개요`)
};

/**
* | output |
* | --- |
* | "Brief overviews of your tutoring conversations" |
*
* @param {Consentflow_Insight_Tutoringoverview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_insight_tutoringoverview2 = /** @type {((inputs?: Consentflow_Insight_Tutoringoverview2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Insight_Tutoringoverview2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_insight_tutoringoverview2(inputs)
	if (locale === "es") return es_consentflow_insight_tutoringoverview2(inputs)
	if (locale === "de") return de_consentflow_insight_tutoringoverview2(inputs)
	if (locale === "ar") return ar_consentflow_insight_tutoringoverview2(inputs)
	if (locale === "fr") return fr_consentflow_insight_tutoringoverview2(inputs)
	return ko_consentflow_insight_tutoringoverview2(inputs)
});
export { consentflow_insight_tutoringoverview2 as "consentFlow.insight.tutoringOverview" }