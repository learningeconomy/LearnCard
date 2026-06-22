/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep4desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard wallet opens, onSuccess is called`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep4desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La billetera de LearnCard se abre, se llama a onSuccess`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep4desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le portefeuille LearnCard s'ouvre, onSuccess est appelé`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep4desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفتح محفظة LearnCard، يتم استدعاء onSuccess`)
};

/**
* | output |
* | --- |
* | "LearnCard wallet opens, onSuccess is called" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep4desc6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep4desc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep4desc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep4desc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep4desc6(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep4desc6(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep4desc6 as "developerPortal.guides.embedClaim.testStep.userFlowStep4Desc" }