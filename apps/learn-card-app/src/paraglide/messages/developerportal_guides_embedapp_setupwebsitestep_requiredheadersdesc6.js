/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server must return these headers to allow iframe embedding:`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server must return these headers to allow iframe embedding:`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server must return these headers to allow iframe embedding:`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server must return these headers to allow iframe embedding:`)
};

/**
* | output |
* | --- |
* | "Your server must return these headers to allow iframe embedding:" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheadersdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_requiredheadersdesc6 as "developerPortal.guides.embedApp.setupWebsiteStep.requiredHeadersDesc" }