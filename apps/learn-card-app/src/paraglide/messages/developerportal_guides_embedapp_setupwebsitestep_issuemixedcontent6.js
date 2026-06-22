/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mixed content error?`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mixed content error?`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mixed content error?`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mixed content error?`)
};

/**
* | output |
* | --- |
* | "Mixed content error?" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Issuemixedcontent6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_issuemixedcontent6 as "developerPortal.guides.embedApp.setupWebsiteStep.issueMixedContent" }