/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_yourappurl6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your App URL`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_yourappurl6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Aplicación URL`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_yourappurl6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Application URL`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_yourappurl6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقك URL`)
};

/**
* | output |
* | --- |
* | "Your App URL" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_yourappurl6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Yourappurl6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_yourappurl6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_yourappurl6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_yourappurl6(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_yourappurl6(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_yourappurl6 as "developerPortal.guides.embedApp.setupWebsiteStep.yourAppUrl" }