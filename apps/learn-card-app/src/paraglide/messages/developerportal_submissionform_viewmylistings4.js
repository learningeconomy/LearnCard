/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Submissionform_Viewmylistings4Inputs */

const en_developerportal_submissionform_viewmylistings4 = /** @type {(inputs: Developerportal_Submissionform_Viewmylistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View My Listings`)
};

const es_developerportal_submissionform_viewmylistings4 = /** @type {(inputs: Developerportal_Submissionform_Viewmylistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Mis Listados`)
};

const fr_developerportal_submissionform_viewmylistings4 = /** @type {(inputs: Developerportal_Submissionform_Viewmylistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir Mes Annonces`)
};

const ar_developerportal_submissionform_viewmylistings4 = /** @type {(inputs: Developerportal_Submissionform_Viewmylistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض قوائمي`)
};

/**
* | output |
* | --- |
* | "View My Listings" |
*
* @param {Developerportal_Submissionform_Viewmylistings4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_submissionform_viewmylistings4 = /** @type {((inputs?: Developerportal_Submissionform_Viewmylistings4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Submissionform_Viewmylistings4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_submissionform_viewmylistings4(inputs)
	if (locale === "es") return es_developerportal_submissionform_viewmylistings4(inputs)
	if (locale === "fr") return fr_developerportal_submissionform_viewmylistings4(inputs)
	return ar_developerportal_submissionform_viewmylistings4(inputs)
});
export { developerportal_submissionform_viewmylistings4 as "developerPortal.submissionForm.viewMyListings" }