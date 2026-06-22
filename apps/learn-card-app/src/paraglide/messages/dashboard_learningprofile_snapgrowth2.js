/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Snapgrowth2Inputs */

const en_dashboard_learningprofile_snapgrowth2 = /** @type {(inputs: Dashboard_Learningprofile_Snapgrowth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Room for growth`)
};

const es_dashboard_learningprofile_snapgrowth2 = /** @type {(inputs: Dashboard_Learningprofile_Snapgrowth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Espacio para crecer`)
};

const fr_dashboard_learningprofile_snapgrowth2 = /** @type {(inputs: Dashboard_Learningprofile_Snapgrowth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marge de progression`)
};

const ar_dashboard_learningprofile_snapgrowth2 = /** @type {(inputs: Dashboard_Learningprofile_Snapgrowth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مجال للتحسّن`)
};

/**
* | output |
* | --- |
* | "Room for growth" |
*
* @param {Dashboard_Learningprofile_Snapgrowth2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_snapgrowth2 = /** @type {((inputs?: Dashboard_Learningprofile_Snapgrowth2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Snapgrowth2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_snapgrowth2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_snapgrowth2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_snapgrowth2(inputs)
	return ar_dashboard_learningprofile_snapgrowth2(inputs)
});
export { dashboard_learningprofile_snapgrowth2 as "dashboard.learningProfile.snapGrowth" }