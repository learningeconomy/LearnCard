/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Tiergrowing2Inputs */

const en_dashboard_learningprofile_tiergrowing2 = /** @type {(inputs: Dashboard_Learningprofile_Tiergrowing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Growing`)
};

const es_dashboard_learningprofile_tiergrowing2 = /** @type {(inputs: Dashboard_Learningprofile_Tiergrowing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En desarrollo`)
};

const fr_dashboard_learningprofile_tiergrowing2 = /** @type {(inputs: Dashboard_Learningprofile_Tiergrowing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En progression`)
};

const ar_dashboard_learningprofile_tiergrowing2 = /** @type {(inputs: Dashboard_Learningprofile_Tiergrowing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`في تطور`)
};

/**
* | output |
* | --- |
* | "Growing" |
*
* @param {Dashboard_Learningprofile_Tiergrowing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_tiergrowing2 = /** @type {((inputs?: Dashboard_Learningprofile_Tiergrowing2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Tiergrowing2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_tiergrowing2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_tiergrowing2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_tiergrowing2(inputs)
	return ar_dashboard_learningprofile_tiergrowing2(inputs)
});
export { dashboard_learningprofile_tiergrowing2 as "dashboard.learningProfile.tierGrowing" }