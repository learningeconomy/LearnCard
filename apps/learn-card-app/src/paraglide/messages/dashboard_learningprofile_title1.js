/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Title1Inputs */

const en_dashboard_learningprofile_title1 = /** @type {(inputs: Dashboard_Learningprofile_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Insights`)
};

const es_dashboard_learningprofile_title1 = /** @type {(inputs: Dashboard_Learningprofile_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus perspectivas`)
};

const fr_dashboard_learningprofile_title1 = /** @type {(inputs: Dashboard_Learningprofile_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos aperçus`)
};

const ar_dashboard_learningprofile_title1 = /** @type {(inputs: Dashboard_Learningprofile_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤاك`)
};

/**
* | output |
* | --- |
* | "Your Insights" |
*
* @param {Dashboard_Learningprofile_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_title1 = /** @type {((inputs?: Dashboard_Learningprofile_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_title1(inputs)
	if (locale === "es") return es_dashboard_learningprofile_title1(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_title1(inputs)
	return ar_dashboard_learningprofile_title1(inputs)
});
export { dashboard_learningprofile_title1 as "dashboard.learningProfile.title" }