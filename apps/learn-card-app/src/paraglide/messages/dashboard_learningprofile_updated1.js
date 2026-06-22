/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ time: NonNullable<unknown> }} Dashboard_Learningprofile_Updated1Inputs */

const en_dashboard_learningprofile_updated1 = /** @type {(inputs: Dashboard_Learningprofile_Updated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Updated ${i?.time}`)
};

const es_dashboard_learningprofile_updated1 = /** @type {(inputs: Dashboard_Learningprofile_Updated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Actualizado ${i?.time}`)
};

const fr_dashboard_learningprofile_updated1 = /** @type {(inputs: Dashboard_Learningprofile_Updated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mis à jour ${i?.time}`)
};

const ar_dashboard_learningprofile_updated1 = /** @type {(inputs: Dashboard_Learningprofile_Updated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`آخر تحديث ${i?.time}`)
};

/**
* | output |
* | --- |
* | "Updated {time}" |
*
* @param {Dashboard_Learningprofile_Updated1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_updated1 = /** @type {((inputs: Dashboard_Learningprofile_Updated1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Updated1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_updated1(inputs)
	if (locale === "es") return es_dashboard_learningprofile_updated1(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_updated1(inputs)
	return ar_dashboard_learningprofile_updated1(inputs)
});
export { dashboard_learningprofile_updated1 as "dashboard.learningProfile.updated" }