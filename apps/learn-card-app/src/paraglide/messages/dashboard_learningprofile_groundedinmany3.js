/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Learningprofile_Groundedinmany3Inputs */

const en_dashboard_learningprofile_groundedinmany3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Grounded in ${i?.count} verified records`)
};

const es_dashboard_learningprofile_groundedinmany3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Basado en ${i?.count} registros verificados`)
};

const fr_dashboard_learningprofile_groundedinmany3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Fondé sur ${i?.count} enregistrements vérifiés`)
};

const ar_dashboard_learningprofile_groundedinmany3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`مستند إلى ${i?.count} سجلات مُوثَّقة`)
};

/**
* | output |
* | --- |
* | "Grounded in {count} verified records" |
*
* @param {Dashboard_Learningprofile_Groundedinmany3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_groundedinmany3 = /** @type {((inputs: Dashboard_Learningprofile_Groundedinmany3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Groundedinmany3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_groundedinmany3(inputs)
	if (locale === "es") return es_dashboard_learningprofile_groundedinmany3(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_groundedinmany3(inputs)
	return ar_dashboard_learningprofile_groundedinmany3(inputs)
});
export { dashboard_learningprofile_groundedinmany3 as "dashboard.learningProfile.groundedInMany" }