/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep3desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential is issued to their wallet`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep3desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La credencial se emite a su billetera`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep3desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le certificat est émis dans son portefeuille`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep3desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتم إصدار المؤهل في محفظته`)
};

/**
* | output |
* | --- |
* | "Credential is issued to their wallet" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep3desc6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep3desc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep3desc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep3desc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep3desc6(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep3desc6(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep3desc6 as "developerPortal.guides.embedClaim.testStep.userFlowStep3Desc" }