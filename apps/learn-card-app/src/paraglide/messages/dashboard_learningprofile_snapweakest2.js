/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Snapweakest2Inputs */

const en_dashboard_learningprofile_snapweakest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapweakest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Needs work`)
};

const es_dashboard_learningprofile_snapweakest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapweakest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Necesita trabajo`)
};

const fr_dashboard_learningprofile_snapweakest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapweakest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À améliorer`)
};

const ar_dashboard_learningprofile_snapweakest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapweakest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحتاج إلى تحسين`)
};

/**
* | output |
* | --- |
* | "Needs work" |
*
* @param {Dashboard_Learningprofile_Snapweakest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_snapweakest2 = /** @type {((inputs?: Dashboard_Learningprofile_Snapweakest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Snapweakest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_snapweakest2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_snapweakest2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_snapweakest2(inputs)
	return ar_dashboard_learningprofile_snapweakest2(inputs)
});
export { dashboard_learningprofile_snapweakest2 as "dashboard.learningProfile.snapWeakest" }