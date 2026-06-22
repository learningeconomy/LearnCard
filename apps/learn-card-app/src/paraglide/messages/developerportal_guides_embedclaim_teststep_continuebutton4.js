/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs */

const en_developerportal_guides_embedclaim_teststep_continuebutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Go Live`)
};

const es_developerportal_guides_embedclaim_teststep_continuebutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar para Publicar`)
};

const fr_developerportal_guides_embedclaim_teststep_continuebutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer vers la Mise en Ligne`)
};

const ar_developerportal_guides_embedclaim_teststep_continuebutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة إلى النشر المباشر`)
};

/**
* | output |
* | --- |
* | "Continue to Go Live" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_continuebutton4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Continuebutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_continuebutton4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_continuebutton4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_continuebutton4(inputs)
	return ar_developerportal_guides_embedclaim_teststep_continuebutton4(inputs)
});
export { developerportal_guides_embedclaim_teststep_continuebutton4 as "developerPortal.guides.embedClaim.testStep.continueButton" }