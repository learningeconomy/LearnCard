/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Snapstrongest2Inputs */

const en_dashboard_learningprofile_snapstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Strongest area`)
};

const es_dashboard_learningprofile_snapstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Área más fuerte`)
};

const fr_dashboard_learningprofile_snapstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Point le plus fort`)
};

const ar_dashboard_learningprofile_snapstrongest2 = /** @type {(inputs: Dashboard_Learningprofile_Snapstrongest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أقوى مجال`)
};

/**
* | output |
* | --- |
* | "Strongest area" |
*
* @param {Dashboard_Learningprofile_Snapstrongest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_snapstrongest2 = /** @type {((inputs?: Dashboard_Learningprofile_Snapstrongest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Snapstrongest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_snapstrongest2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_snapstrongest2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_snapstrongest2(inputs)
	return ar_dashboard_learningprofile_snapstrongest2(inputs)
});
export { dashboard_learningprofile_snapstrongest2 as "dashboard.learningProfile.snapStrongest" }