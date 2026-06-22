/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Earlyread2Inputs */

const en_dashboard_learningprofile_earlyread2 = /** @type {(inputs: Dashboard_Learningprofile_Earlyread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Early read`)
};

const es_dashboard_learningprofile_earlyread2 = /** @type {(inputs: Dashboard_Learningprofile_Earlyread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista preliminar`)
};

const fr_dashboard_learningprofile_earlyread2 = /** @type {(inputs: Dashboard_Learningprofile_Earlyread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu préliminaire`)
};

const ar_dashboard_learningprofile_earlyread2 = /** @type {(inputs: Dashboard_Learningprofile_Earlyread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قراءة مبكرة`)
};

/**
* | output |
* | --- |
* | "Early read" |
*
* @param {Dashboard_Learningprofile_Earlyread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_earlyread2 = /** @type {((inputs?: Dashboard_Learningprofile_Earlyread2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Earlyread2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_earlyread2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_earlyread2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_earlyread2(inputs)
	return ar_dashboard_learningprofile_earlyread2(inputs)
});
export { dashboard_learningprofile_earlyread2 as "dashboard.learningProfile.earlyRead" }