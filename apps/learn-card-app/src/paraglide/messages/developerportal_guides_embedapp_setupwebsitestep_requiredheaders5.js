/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Required Response Headers`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requerido Response Headers`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requis Response Headers`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب Response Headers`)
};

/**
* | output |
* | --- |
* | "Required Response Headers" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_requiredheaders5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Requiredheaders5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_requiredheaders5(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_requiredheaders5 as "developerPortal.guides.embedApp.setupWebsiteStep.requiredHeaders" }