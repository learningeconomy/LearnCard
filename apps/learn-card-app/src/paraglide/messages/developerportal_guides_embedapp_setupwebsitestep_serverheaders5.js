/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_serverheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headers`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_serverheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headers`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_serverheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headers`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_serverheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headers`)
};

/**
* | output |
* | --- |
* | "Server Headers" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_serverheaders5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Serverheaders5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_serverheaders5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_serverheaders5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_serverheaders5(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_serverheaders5(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_serverheaders5 as "developerPortal.guides.embedApp.setupWebsiteStep.serverHeaders" }