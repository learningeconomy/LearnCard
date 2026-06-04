/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Newsubmission1Inputs */

const en_alerts_newsubmission1 = /** @type {(inputs: Alerts_Newsubmission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Submission`)
};

const es_alerts_newsubmission1 = /** @type {(inputs: Alerts_Newsubmission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo envío`)
};

const de_alerts_newsubmission1 = /** @type {(inputs: Alerts_Newsubmission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue Einreichung`)
};

const ar_alerts_newsubmission1 = /** @type {(inputs: Alerts_Newsubmission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال جديد`)
};

const fr_alerts_newsubmission1 = /** @type {(inputs: Alerts_Newsubmission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle soumission`)
};

const ko_alerts_newsubmission1 = /** @type {(inputs: Alerts_Newsubmission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 제출`)
};

/**
* | output |
* | --- |
* | "New Submission" |
*
* @param {Alerts_Newsubmission1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_newsubmission1 = /** @type {((inputs?: Alerts_Newsubmission1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Newsubmission1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_newsubmission1(inputs)
	if (locale === "es") return es_alerts_newsubmission1(inputs)
	if (locale === "de") return de_alerts_newsubmission1(inputs)
	if (locale === "ar") return ar_alerts_newsubmission1(inputs)
	if (locale === "fr") return fr_alerts_newsubmission1(inputs)
	return ko_alerts_newsubmission1(inputs)
});
export { alerts_newsubmission1 as "alerts.newSubmission" }