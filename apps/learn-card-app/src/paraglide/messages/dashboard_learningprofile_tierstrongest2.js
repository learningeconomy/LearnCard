/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Tierstrongest2Inputs */

const en_dashboard_learningprofile_tierstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Tierstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Strongest`)
};

const es_dashboard_learningprofile_tierstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Tierstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Más fuerte`)
};

const fr_dashboard_learningprofile_tierstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Tierstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le plus fort`)
};

const ar_dashboard_learningprofile_tierstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Tierstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأقوى`)
};

/**
* | output |
* | --- |
* | "Strongest" |
*
* @param {Dashboard_Learningprofile_Tierstrongest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_tierstrongest2 = /** @type {((inputs?: Dashboard_Learningprofile_Tierstrongest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Tierstrongest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_tierstrongest2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_tierstrongest2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_tierstrongest2(inputs)
	return ar_dashboard_learningprofile_tierstrongest2(inputs)
});
export { dashboard_learningprofile_tierstrongest2 as "dashboard.learningProfile.tierStrongest" }