/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Viewinsights2Inputs */

const en_dashboard_learningprofile_viewinsights2 = /** @type {(inputs: Dashboard_Learningprofile_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View insights →`)
};

const es_dashboard_learningprofile_viewinsights2 = /** @type {(inputs: Dashboard_Learningprofile_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver perspectivas →`)
};

const fr_dashboard_learningprofile_viewinsights2 = /** @type {(inputs: Dashboard_Learningprofile_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les aperçus →`)
};

const ar_dashboard_learningprofile_viewinsights2 = /** @type {(inputs: Dashboard_Learningprofile_Viewinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الرؤى →`)
};

/**
* | output |
* | --- |
* | "View insights →" |
*
* @param {Dashboard_Learningprofile_Viewinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_viewinsights2 = /** @type {((inputs?: Dashboard_Learningprofile_Viewinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Viewinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_viewinsights2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_viewinsights2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_viewinsights2(inputs)
	return ar_dashboard_learningprofile_viewinsights2(inputs)
});
export { dashboard_learningprofile_viewinsights2 as "dashboard.learningProfile.viewInsights" }