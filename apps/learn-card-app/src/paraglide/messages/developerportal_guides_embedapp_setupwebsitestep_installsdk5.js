/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_installsdk5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Install Partner Connect SDK`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_installsdk5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Install Partner Connect SDK`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_installsdk5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Install Partner Connect SDK`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_installsdk5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Install Partner Connect SDK`)
};

/**
* | output |
* | --- |
* | "2. Install Partner Connect SDK" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_installsdk5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Installsdk5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_installsdk5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_installsdk5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_installsdk5(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_installsdk5(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_installsdk5 as "developerPortal.guides.embedApp.setupWebsiteStep.installSdk" }