/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_urlhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your URL and click Check to verify requirements`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_urlhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your URL and click Verificar to verify requirements`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_urlhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your URL and click Vérifier to verify requirements`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_urlhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your URL and click تحقق to verify requirements`)
};

/**
* | output |
* | --- |
* | "Enter your URL and click Check to verify requirements" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_urlhint5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Urlhint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_urlhint5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_urlhint5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_urlhint5(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_urlhint5(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_urlhint5 as "developerPortal.guides.embedApp.setupWebsiteStep.urlHint" }