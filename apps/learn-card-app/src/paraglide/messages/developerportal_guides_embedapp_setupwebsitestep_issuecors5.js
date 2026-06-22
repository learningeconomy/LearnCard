/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_issuecors5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS errors?`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_issuecors5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS errors?`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_issuecors5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS errors?`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_issuecors5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS errors?`)
};

/**
* | output |
* | --- |
* | "CORS errors?" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_issuecors5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Issuecors5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_issuecors5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_issuecors5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_issuecors5(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_issuecors5(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_issuecors5 as "developerPortal.guides.embedApp.setupWebsiteStep.issueCors" }