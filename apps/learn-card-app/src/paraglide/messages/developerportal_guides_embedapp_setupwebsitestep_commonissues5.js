/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_commonissues5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common Issues`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_commonissues5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common Issues`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_commonissues5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common Issues`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_commonissues5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common Issues`)
};

/**
* | output |
* | --- |
* | "Common Issues" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_commonissues5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Commonissues5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_commonissues5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_commonissues5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_commonissues5(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_commonissues5(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_commonissues5 as "developerPortal.guides.embedApp.setupWebsiteStep.commonIssues" }