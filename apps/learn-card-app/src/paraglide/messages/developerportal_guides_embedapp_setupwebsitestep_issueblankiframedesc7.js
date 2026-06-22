/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check your X-Frame-Options header isn't set to DENY or SAMEORIGIN`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar your X-Frame-Options header isn't set to DENY or SAMEORIGIN`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier your X-Frame-Options header isn't set to DENY or SAMEORIGIN`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق your X-Frame-Options header isn't set to DENY or SAMEORIGIN`)
};

/**
* | output |
* | --- |
* | "Check your X-Frame-Options header isn't set to DENY or SAMEORIGIN" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Issueblankiframedesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_issueblankiframedesc7 as "developerPortal.guides.embedApp.setupWebsiteStep.issueBlankIframeDesc" }