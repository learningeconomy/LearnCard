/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_check4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_check4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_check4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_check4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق`)
};

/**
* | output |
* | --- |
* | "Check" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_check4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Check4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_check4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_check4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_check4(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_check4(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_check4 as "developerPortal.guides.embedApp.setupWebsiteStep.check" }