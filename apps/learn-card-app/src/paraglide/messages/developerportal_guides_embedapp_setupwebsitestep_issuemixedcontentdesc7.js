/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your app uses HTTPS`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your app uses HTTPS`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your app uses HTTPS`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure your app uses HTTPS`)
};

/**
* | output |
* | --- |
* | "Make sure your app uses HTTPS" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontentdesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_issuemixedcontentdesc7 as "developerPortal.guides.embedApp.setupWebsiteStep.issueMixedContentDesc" }