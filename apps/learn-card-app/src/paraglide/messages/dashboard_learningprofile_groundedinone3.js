/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Learningprofile_Groundedinone3Inputs */

const en_dashboard_learningprofile_groundedinone3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Grounded in ${i?.count} verified record`)
};

const es_dashboard_learningprofile_groundedinone3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Basado en ${i?.count} registro verificado`)
};

const fr_dashboard_learningprofile_groundedinone3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Fondé sur ${i?.count} enregistrement vérifié`)
};

const ar_dashboard_learningprofile_groundedinone3 = /** @type {(inputs: Dashboard_Learningprofile_Groundedinone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`مستند إلى سجل واحد مُوثَّق`)
};

/**
* | output |
* | --- |
* | "Grounded in {count} verified record" |
*
* @param {Dashboard_Learningprofile_Groundedinone3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_groundedinone3 = /** @type {((inputs: Dashboard_Learningprofile_Groundedinone3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Groundedinone3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_groundedinone3(inputs)
	if (locale === "es") return es_dashboard_learningprofile_groundedinone3(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_groundedinone3(inputs)
	return ar_dashboard_learningprofile_groundedinone3(inputs)
});
export { dashboard_learningprofile_groundedinone3 as "dashboard.learningProfile.groundedInOne" }